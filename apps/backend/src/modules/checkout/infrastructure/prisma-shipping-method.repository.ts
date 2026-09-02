import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import type { ShippingMethod } from '../domain/entities/shipping-method.entity.js';
import { ShippingMethodRepository } from '../domain/repositories/shipping-method.repository.js';
import { toDomainShippingMethod } from './checkout.mapper.js';

/** Implementacion del puerto de metodos de entrega sobre PostgreSQL. */
@Injectable()
export class PrismaShippingMethodRepository extends ShippingMethodRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAllActive(): Promise<ShippingMethod[]> {
    const rows = await this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { priceCents: 'asc' }],
    });
    return rows.map(toDomainShippingMethod);
  }

  async findActiveById(id: string): Promise<ShippingMethod | null> {
    const row = await this.prisma.shippingMethod.findFirst({ where: { id, isActive: true } });
    return row === null ? null : toDomainShippingMethod(row);
  }
}
