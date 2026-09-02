import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { NotFoundError } from '../../../shared/domain/domain-error.js';
import { buildPage, toSkipTake, type Page, type PageRequest } from '../../../shared/domain/pagination.js';
import type { Prisma } from '../../../shared/infrastructure/prisma/generated-client.js';
import type { Order, OrderStatusValue } from '../domain/entities/order.entity.js';
import { OrderNumber } from '../domain/value-objects/order-number.js';
import {
  OrderRepository,
  type NewOrderDraft,
  type OrderAdminFilter,
} from '../domain/repositories/order.repository.js';
import { InsufficientStockError } from '../domain/errors.js';
import { ORDER_INCLUDE, toDomainOrder } from './checkout.mapper.js';

/**
 * Implementacion del puerto de ordenes sobre PostgreSQL.
 *
 * Concentra la unica operacion realmente delicada del sistema: convertir un
 * carrito en una orden sin vender dos veces la ultima unidad.
 */
@Injectable()
export class PrismaOrderRepository extends OrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async place(draft: NewOrderDraft): Promise<Order> {
    const row = await this.prisma.$transaction(async (tx) => {
      // Reserva del stock. La condicion "stock >= cantidad" viaja dentro del
      // propio UPDATE, asi que la comprobacion y el descuento ocurren en la
      // misma sentencia atomica: dos compras simultaneas de la ultima unidad
      // no pueden pasar ambas. Si no se actualizo ninguna fila es que ya no
      // habia suficiente, y la transaccion entera se deshace.
      for (const item of draft.items) {
        if (item.variantId === null) continue;

        const reserved = await tx.productVariant.updateMany({
          where: { id: item.variantId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (reserved.count === 0) {
          const current = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          });
          throw new InsufficientStockError(item.sku, item.quantity, current?.stock ?? 0);
        }
      }

      const number = await this.nextOrderNumber(tx);

      return tx.order.create({
        data: {
          number: number.value,
          userId: draft.userId,
          status: 'PENDING_PAYMENT',
          paymentMethod: draft.paymentMethod,

          customerName: draft.customer.name,
          customerEmail: draft.customer.email,
          customerPhone: draft.customer.phone,
          idType: draft.customer.identification.type,
          idNumber: draft.customer.identification.number,

          needsInvoice: draft.invoice !== null,
          businessName: draft.invoice?.businessName ?? null,
          ruc: draft.invoice?.ruc ?? null,

          shippingMethodId: draft.shippingMethodId,
          shippingMethodName: draft.shippingMethodName,

          subtotalCents: draft.totals.subtotal.cents,
          shippingCents: draft.totals.shipping.cents,
          taxCents: draft.totals.tax.cents,
          totalCents: draft.totals.total.cents,
          taxRateBps: draft.totals.taxRateBps,

          paymentDueAt: draft.paymentDueAt,
          customerNote: draft.customerNote,

          items: {
            create: draft.items.map((item) => ({
              variantId: item.variantId,
              productName: item.productName,
              productSlug: item.productSlug,
              variantLabel: item.variantLabel,
              sku: item.sku,
              imageUrl: item.imageUrl,
              unitPriceCents: item.unitPrice.cents,
              quantity: item.quantity,
              lineTotalCents: item.lineTotal.cents,
            })),
          },

          addresses: {
            create: [
              { kind: 'SHIPPING', ...addressData(draft.shippingAddress) },
              { kind: 'BILLING', ...addressData(draft.billingAddress) },
            ],
          },

          // Primer asiento de la bitacora, sin autor: lo genera el sistema.
          statusHistory: {
            create: [{ from: null, to: 'PENDING_PAYMENT', note: 'Orden creada por el cliente.' }],
          },
        },
        include: ORDER_INCLUDE,
      });
    });

    return toDomainOrder(row);
  }

  async findByNumber(number: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { number },
      include: ORDER_INCLUDE,
    });
    return row === null ? null : toDomainOrder(row);
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    return row === null ? null : toDomainOrder(row);
  }

  async attachToUser(orderId: string, userId: string): Promise<void> {
    // Solo se vinculan ordenes todavia huerfanas: reasignar una orden que ya
    // pertenece a otra cuenta seria una fuga de datos entre clientes.
    const updated = await this.prisma.order.updateMany({
      where: { id: orderId, userId: null },
      data: { userId },
    });

    if (updated.count === 0) {
      throw new NotFoundError('la orden sin vincular', orderId);
    }
  }

  async attachGuestOrdersByEmail(email: string, userId: string): Promise<number> {
    const updated = await this.prisma.order.updateMany({
      // La condicion userId: null es la salvaguarda: impide que iniciar sesion
      // con un correo reutilizado se lleve las ordenes de otra cuenta.
      where: { customerEmail: email.trim().toLowerCase(), userId: null },
      data: { userId },
    });
    return updated.count;
  }

  async updateStatus(
    orderId: string,
    next: OrderStatusValue,
    context: { changedById: string | null; note: string | null },
  ): Promise<Order> {
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (current === null) {
        throw new NotFoundError('la orden', orderId);
      }

      const now = new Date();
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: next,
          paidAt: next === 'PAID' ? now : undefined,
          cancelledAt: next === 'CANCELLED' ? now : undefined,
          adminNote: context.note ?? undefined,
        },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          from: current.status,
          to: next,
          note: context.note,
          changedById: context.changedById,
        },
      });

      return updated;
    });

    return toDomainOrder(row);
  }

  async listAdmin(filter: OrderAdminFilter, page: PageRequest): Promise<Page<Order>> {
    const where: Prisma.OrderWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { number: { contains: filter.search, mode: 'insensitive' } },
              { customerName: { contains: filter.search, mode: 'insensitive' } },
              { customerEmail: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const { skip, take } = toSkipTake(page);
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return buildPage(rows.map(toDomainOrder), total, page);
  }

  countOverduePending(): Promise<number> {
    return this.prisma.order.count({
      where: { status: 'PENDING_PAYMENT', paymentDueAt: { lt: new Date() } },
    });
  }

  async sumRevenue(from: Date, to: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'COMPLETED'] },
        createdAt: { gte: from, lt: to },
      },
      _sum: { totalCents: true },
    });
    return result._sum.totalCents ?? 0;
  }

  countByStatus(status: OrderStatusValue): Promise<number> {
    return this.prisma.order.count({ where: { status } });
  }

  /**
   * Toma el siguiente codigo publico de la secuencia de PostgreSQL.
   *
   * Se usa una secuencia y no un COUNT(*) porque nextval es atomico y no
   * retrocede: dos compras concurrentes nunca obtienen el mismo numero.
   */
  private async nextOrderNumber(
    tx: Pick<PrismaService, '$queryRaw'>,
  ): Promise<OrderNumber> {
    const [{ value }] = await tx.$queryRaw<{ value: bigint }[]>`
      SELECT nextval('order_number_seq') AS value
    `;
    return OrderNumber.fromSequence(Number(value));
  }
}

function addressData(address: {
  country: string;
  state: string;
  city: string;
  district: string;
  street: string;
  apartment: string | null;
}) {
  return {
    country: address.country,
    state: address.state,
    city: address.city,
    district: address.district,
    street: address.street,
    apartment: address.apartment,
  };
}
