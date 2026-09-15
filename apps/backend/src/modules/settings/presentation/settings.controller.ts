import { Body, Controller, Get, NotFoundException, Patch } from '@nestjs/common';
import { GetStoreSettingsUseCase } from '../application/use-cases/get-store-settings.use-case.js';
import { UpdateStoreSettingsUseCase } from '../application/use-cases/update-store-settings.use-case.js';
import { MediaAssetRepository } from '../../media/domain/repositories/media-asset.repository.js';
import { Roles } from '../../auth/presentation/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator.js';
import type { User } from '../../auth/domain/entities/user.entity.js';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto.js';
import { toStoreSettingsView, type StoreSettingsView } from './settings.view-model.js';

/**
 * Configuracion de pago y de empresa del panel.
 *
 * Incluye el numero de Yape, las cuentas bancarias y el QR: es exactamente lo
 * que antes vivia en variables de entorno y ahora edita cualquier
 * administrador sin necesitar un despliegue.
 */
@Roles('ADMIN')
@Controller('admin/settings')
export class SettingsController {
  constructor(
    private readonly getSettings: GetStoreSettingsUseCase,
    private readonly updateSettings: UpdateStoreSettingsUseCase,
    private readonly media: MediaAssetRepository,
  ) {}

  @Get()
  async get(): Promise<StoreSettingsView> {
    return toStoreSettingsView(await this.getSettings.execute());
  }

  @Patch()
  async update(
    @Body() dto: UpdateStoreSettingsDto,
    @CurrentUser() user: User,
  ): Promise<StoreSettingsView> {
    // El QR se referencia por el identificador de un archivo ya subido a
    // /admin/media, nunca por una url escrita a mano: asi se reutiliza la
    // misma validacion de tipo y tamano que protege cualquier otra imagen.
    let yapeQrUrl: string | null | undefined;
    if (dto.yapeQrAssetId === null) {
      yapeQrUrl = null;
    } else if (dto.yapeQrAssetId !== undefined) {
      const asset = await this.media.findById(dto.yapeQrAssetId);
      if (asset === null) {
        throw new NotFoundException('El archivo indicado para el QR no existe.');
      }
      yapeQrUrl = asset.url;
    }

    const settings = await this.updateSettings.execute(
      {
        companyName: dto.companyName,
        companyRuc: dto.companyRuc,
        companyEmail: dto.companyEmail,
        whatsapp: dto.whatsapp,
        yapePhone: dto.yapePhone,
        yapeQrUrl,
        paymentWindowHours: dto.paymentWindowHours,
        bankAccounts: dto.bankAccounts,
      },
      user.id,
    );

    return toStoreSettingsView(settings);
  }
}
