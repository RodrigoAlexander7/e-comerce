import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { Public } from '../../auth/presentation/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator.js';
import type { User } from '../../auth/domain/entities/user.entity.js';
import { GetStoreSettingsUseCase } from '../../settings/application/use-cases/get-store-settings.use-case.js';
import { QuoteCartUseCase } from '../application/use-cases/quote-cart.use-case.js';
import { ListShippingMethodsUseCase } from '../application/use-cases/list-shipping-methods.use-case.js';
import { PlaceOrderUseCase } from '../application/use-cases/place-order.use-case.js';
import { GetOrderByNumberUseCase } from '../application/use-cases/get-order-by-number.use-case.js';
import { QuoteCartDto } from './dto/cart.dto.js';
import { PlaceOrderDto } from './dto/place-order.dto.js';
import {
  toCartQuoteView,
  toOrderView,
  toPaymentInstructionsView,
  toShippingMethodView,
  type CartQuoteView,
  type OrderView,
  type PaymentInstructionsView,
  type ShippingMethodView,
} from './checkout.view-model.js';

/**
 * Superficie HTTP del checkout.
 *
 * Todas las rutas son publicas: el modelo de negocio admite compra como
 * invitado, asi que exigir sesion aqui romperia el flujo principal. La
 * consulta de una orden concreta se protege pidiendo el correo del comprador
 * ademas del numero.
 *
 * Aun siendo publica, si la peticion trae una sesion valida el guardian la
 * resuelve igualmente (ver SessionGuard): por eso createOrder puede leer
 * @CurrentUser() y vincular la compra a la cuenta desde el primer momento,
 * sin depender de la adopcion posterior por correo al iniciar sesion.
 */
@Public()
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly quoteCart: QuoteCartUseCase,
    private readonly listShippingMethods: ListShippingMethodsUseCase,
    private readonly placeOrder: PlaceOrderUseCase,
    private readonly getOrder: GetOrderByNumberUseCase,
    private readonly getSettings: GetStoreSettingsUseCase,
  ) {}

  /**
   * Tasa el carrito con los precios vigentes.
   *
   * Es POST y no GET porque el carrito puede tener decenas de lineas y no cabe
   * comodamente en una cadena de consulta. No modifica nada del servidor.
   */
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  async quote(@Body() dto: QuoteCartDto): Promise<CartQuoteView> {
    const quote = await this.quoteCart.execute({
      lines: dto.lines,
      shippingMethodId: dto.shippingMethodId,
    });
    return toCartQuoteView(quote);
  }

  @Get('shipping-methods')
  async shippingMethods(): Promise<ShippingMethodView[]> {
    const methods = await this.listShippingMethods.execute();
    return methods.map(toShippingMethodView);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() dto: PlaceOrderDto,
    @CurrentUser() user: User | null,
  ): Promise<{ order: OrderView; payment: PaymentInstructionsView }> {
    const order = await this.placeOrder.execute({
      lines: dto.lines,
      shippingMethodId: dto.shippingMethodId,
      paymentMethod: dto.paymentMethod,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      idType: dto.idType,
      idNumber: dto.idNumber,
      needsInvoice: dto.needsInvoice,
      businessName: dto.businessName,
      ruc: dto.ruc,
      shippingAddress: dto.shippingAddress,
      billingAddress: dto.billingAddress ?? null,
      customerNote: dto.customerNote,
      userId: user?.id ?? null,
    });

    const settings = await this.getSettings.execute();
    return {
      order: toOrderView(order),
      payment: toPaymentInstructionsView(settings, order.number.value),
    };
  }

  /**
   * Consulta de una orden para la pagina de confirmacion.
   *
   * Exige el correo del comprador ademas del numero: el codigo por si solo es
   * corto y correlativo, asi que sin esa segunda prueba cualquiera podria
   * recorrer numeros y leer datos personales ajenos.
   */
  @Get('orders')
  async findOrder(
    @Query('number') number: string,
    @Query('email') email: string,
  ): Promise<{ order: OrderView; payment: PaymentInstructionsView }> {
    const order = await this.getOrder.execute(number ?? '', email ?? '');
    const settings = await this.getSettings.execute();
    return {
      order: toOrderView(order),
      payment: toPaymentInstructionsView(settings, order.number.value),
    };
  }
}
