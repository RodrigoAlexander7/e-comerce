import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CheckoutModule } from '../checkout/checkout.module.js';
import { GetDashboardMetricsUseCase } from './application/get-dashboard-metrics.use-case.js';
import { DashboardController } from './presentation/dashboard.controller.js';

/**
 * Dashboard principal del panel.
 *
 * Es el unico modulo que cruza catalogo y checkout en una sola consulta
 * agregada. Importa ambos por sus puertos ya exportados (ProductRepository,
 * OrderRepository); no anade infraestructura propia.
 */
@Module({
  imports: [CatalogModule, CheckoutModule],
  controllers: [DashboardController],
  providers: [GetDashboardMetricsUseCase],
})
export class AdminModule {}
