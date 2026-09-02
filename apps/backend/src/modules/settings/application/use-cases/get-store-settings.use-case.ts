import { Injectable } from '@nestjs/common';
import type { StoreSettings } from '../../domain/entities/store-settings.entity.js';
import { StoreSettingsRepository } from '../../domain/repositories/store-settings.repository.js';

/** Lee la configuracion de pago y de empresa vigente. */
@Injectable()
export class GetStoreSettingsUseCase {
  constructor(private readonly settings: StoreSettingsRepository) {}

  execute(): Promise<StoreSettings> {
    return this.settings.get();
  }
}
