import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { OrderRepository } from './domain/repositories/order.repository.js';
import { ShippingMethodRepository } from './domain/repositories/shipping-method.repository.js';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository.js';
import { PrismaShippingMethodRepository } from './infrastructure/prisma-shipping-method.repository.js';
import { CartResolver } from './application/cart-resolver.service.js';
import { QuoteCartUseCase } from './application/use-cases/quote-cart.use-case.js';
import { ListShippingMethodsUseCase } from './application/use-cases/list-shipping-methods.use-case.js';
import { PlaceOrderUseCase } from './application/use-cases/place-order.use-case.js';
import { GetOrderByNumberUseCase } from './application/use-cases/get-order-by-number.use-case.js';
import { ListOrdersAdminUseCase } from './application/use-cases/admin/list-orders-admin.use-case.js';
import { GetOrderAdminUseCase } from './application/use-cases/admin/get-order-admin.use-case.js';
import { UpdateOrderStatusUseCase } from './application/use-cases/admin/update-order-status.use-case.js';
import { CheckoutController } from './presentation/checkout.controller.js';
import { AdminOrdersController } from './presentation/admin-orders.controller.js';

/**
 * Cableado del checkout.
 *
 * Importa CatalogModule por su puerto ProductRepository (para releer precios y
 * stock), NotificationsModule por OrderNotifier y SettingsModule por los datos
 * de pago editables (plazo, cuentas, QR). En todos los casos consume solo la
 * abstraccion: no conoce Prisma del catalogo, Nodemailer del correo, ni donde
 * se guarda la configuracion de la tienda.
 *
 * AdminOrdersController vive aqui y no en un modulo aparte porque opera sobre
 * el mismo agregado Order: separarlo obligaria a exportar OrderRepository con
 * mas superficie de la que el checkout publico necesita, solo para volver a
 * importarla en otro sitio.
 */
@Module({
  imports: [CatalogModule, NotificationsModule, SettingsModule],
  controllers: [CheckoutController, AdminOrdersController],
  providers: [
    { provide: OrderRepository, useClass: PrismaOrderRepository },
    { provide: ShippingMethodRepository, useClass: PrismaShippingMethodRepository },
    CartResolver,
    QuoteCartUseCase,
    ListShippingMethodsUseCase,
    PlaceOrderUseCase,
    GetOrderByNumberUseCase,
    ListOrdersAdminUseCase,
    GetOrderAdminUseCase,
    UpdateOrderStatusUseCase,
  ],
  exports: [OrderRepository],
})
export class CheckoutModule {}
