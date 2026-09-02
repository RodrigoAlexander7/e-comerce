import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles } from '../../auth/presentation/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator.js';
import type { User } from '../../auth/domain/entities/user.entity.js';
import { ListOrdersAdminUseCase } from '../application/use-cases/admin/list-orders-admin.use-case.js';
import { GetOrderAdminUseCase } from '../application/use-cases/admin/get-order-admin.use-case.js';
import { UpdateOrderStatusUseCase } from '../application/use-cases/admin/update-order-status.use-case.js';
import { ListOrdersAdminQuery, UpdateOrderStatusDto } from './dto/admin-order.dto.js';
import {
  toAdminOrderSummaryView,
  toAdminOrderView,
  type AdminOrderSummaryView,
  type AdminOrderView,
} from './admin-order.view-model.js';
import { toPageView, type PageView } from '../../catalog/presentation/product.view-model.js';

/**
 * Gestion de ordenes y verificacion de pagos del panel.
 *
 * Es el nucleo del negocio: aqui un administrador confirma que un abono de
 * Yape, Plin o transferencia realmente llego antes de dar la orden por
 * pagada, algo que ningun proveedor de pago puede automatizar.
 */
@Roles('ADMIN')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly listOrdersAdmin: ListOrdersAdminUseCase,
    private readonly getOrderAdmin: GetOrderAdminUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListOrdersAdminQuery): Promise<PageView<AdminOrderSummaryView>> {
    const result = await this.listOrdersAdmin.execute(
      { status: query.status, search: query.search },
      {
        page: Number.parseInt(query.page ?? '1', 10) || 1,
        perPage: Math.min(Number.parseInt(query.perPage ?? '20', 10) || 20, 100),
      },
    );
    return toPageView(result, toAdminOrderSummaryView);
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<AdminOrderView> {
    const order = await this.getOrderAdmin.execute(id);
    return toAdminOrderView(order);
  }

  @Patch(':id/estado')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ): Promise<AdminOrderView> {
    const order = await this.updateOrderStatus.execute({
      orderId: id,
      next: dto.status,
      changedById: user.id,
      note: dto.note,
    });
    return toAdminOrderView(order);
  }
}
