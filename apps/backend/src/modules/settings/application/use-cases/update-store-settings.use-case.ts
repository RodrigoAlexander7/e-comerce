import { Injectable } from '@nestjs/common';
import type { StoreSettings } from '../../domain/entities/store-settings.entity.js';
import {
  StoreSettingsRepository,
  type UpdateStoreSettingsInput,
} from '../../domain/repositories/store-settings.repository.js';

/** Actualiza la configuracion de pago y de empresa desde el panel. */
@Injectable()
export class UpdateStoreSettingsUseCase {
  constructor(private readonly settings: StoreSettingsRepository) {}

  execute(patch: UpdateStoreSettingsInput, updatedById: string): Promise<StoreSettings> {
    return this.settings.update(patch, updatedById);
  }
}
