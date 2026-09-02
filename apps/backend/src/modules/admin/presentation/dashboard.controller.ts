import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../auth/presentation/decorators/roles.decorator.js';
import { GetDashboardMetricsUseCase } from '../application/get-dashboard-metrics.use-case.js';
import { toDashboardView, type DashboardView } from './dashboard.view-model.js';

/** Indicadores del panel principal: ventas del mes, ordenes por verificar, stock bajo. */
@Roles('ADMIN')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly getMetrics: GetDashboardMetricsUseCase) {}

  @Get()
  async metrics(): Promise<DashboardView> {
    return toDashboardView(await this.getMetrics.execute());
  }
}
