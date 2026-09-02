import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../../../config/app-config.js';
import { StoreSettingsRepository } from '../../../settings/domain/repositories/store-settings.repository.js';
import type { Order, PaymentMethodValue } from '../../domain/entities/order.entity.js';
import { Address, type AddressInput } from '../../domain/value-objects/address.js';
import { CustomerDetails } from '../../domain/value-objects/customer-details.js';
import { Identification, type IdentificationTypeValue } from '../../domain/value-objects/identification.js';
import { InvoiceDetails } from '../../domain/value-objects/invoice-details.js';
import { calculateOrderTotals } from '../../domain/services/order-pricing.js';
import { OrderRepository } from '../../domain/repositories/order.repository.js';
import { ShippingMethodRepository } from '../../domain/repositories/shipping-method.repository.js';
import { EmptyCartError, ShippingMethodNotFoundError } from '../../domain/errors.js';
import { CartResolver, type CartLineInput } from '../cart-resolver.service.js';
import { OrderNotifier } from '../ports/order-notifier.port.js';

export interface PlaceOrderInput {
  readonly lines: readonly CartLineInput[];
  readonly shippingMethodId: string;
  readonly paymentMethod: PaymentMethodValue;

  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly idType: IdentificationTypeValue;
  readonly idNumber: string;

  readonly needsInvoice: boolean;
  readonly businessName?: string | null;
  readonly ruc?: string | null;

  readonly shippingAddress: AddressInput;
  /** Ausente cuando el cliente marca "igual que la direccion de entrega". */
  readonly billingAddress?: AddressInput | null;

  readonly customerNote?: string | null;
  /** Presente solo si la compra la hace un usuario con sesion iniciada. */
  readonly userId?: string | null;
}

/**
 * Confirma la compra: el paso 3 del checkout.
 *
 * Recalcula todo desde cero con los precios vigentes del catalogo, ignorando
 * cualquier importe que venga en la peticion, y delega en el repositorio la
 * creacion atomica de la orden junto al descuento de stock.
 */
@Injectable()
export class PlaceOrderUseCase {
  private readonly logger = new Logger(PlaceOrderUseCase.name);

  constructor(
    private readonly cartResolver: CartResolver,
    private readonly shippingMethods: ShippingMethodRepository,
    private readonly orders: OrderRepository,
    private readonly notifier: OrderNotifier,
    private readonly storeSettings: StoreSettingsRepository,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(input: PlaceOrderInput): Promise<Order> {
    const method = await this.shippingMethods.findActiveById(input.shippingMethodId);
    if (method === null) {
      throw new ShippingMethodNotFoundError(input.shippingMethodId);
    }

    const { items } = await this.cartResolver.resolve(input.lines);
    if (items.length === 0) {
      // Todas las lineas resultaron inatendibles: no hay nada que cobrar.
      throw new EmptyCartError();
    }

    const customer = CustomerDetails.create({
      name: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone,
      identification: Identification.create(input.idType, input.idNumber),
    });

    const invoice = input.needsInvoice
      ? InvoiceDetails.create(input.businessName ?? '', input.ruc ?? '')
      : null;

    const shippingAddress = Address.create(input.shippingAddress);
    // Reutilizar la direccion de envio como fiscal es lo que hace el conmutador
    // "Igual que la direccion de entrega" del paso 2.
    const billingAddress = input.billingAddress
      ? Address.create(input.billingAddress)
      : shippingAddress;

    const totals = calculateOrderTotals(items, method.price, this.config.taxRateBps);

    // El plazo de pago es configuracion editable desde el panel, no una
    // variable de entorno: un administrador puede ampliarlo o acortarlo sin
    // necesitar un despliegue.
    const settings = await this.storeSettings.get();
    const paymentDueAt = new Date(Date.now() + settings.paymentWindowHours * 60 * 60 * 1000);

    const order = await this.orders.place({
      userId: input.userId ?? null,
      paymentMethod: input.paymentMethod,
      customer,
      invoice,
      shippingAddress,
      billingAddress,
      shippingMethodId: method.id,
      shippingMethodName: method.name,
      items,
      totals,
      paymentDueAt,
      customerNote: input.customerNote?.trim() || null,
    });

    // El correo no forma parte de la transaccion: si el servidor de correo
    // esta caido la compra ya es valida y no debe deshacerse por eso. Se
    // registra el fallo para poder reenviarlo desde el panel.
    try {
      await this.notifier.notifyPaymentPending(order);
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de pago pendiente de la orden ${order.number.value}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return order;
  }
}
