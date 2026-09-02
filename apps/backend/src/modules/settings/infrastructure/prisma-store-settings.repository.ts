import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { APP_CONFIG, type AppConfig } from '../../../config/app-config.js';
import { StoreSettings } from '../domain/entities/store-settings.entity.js';
import {
  StoreSettingsRepository,
  type UpdateStoreSettingsInput,
} from '../domain/repositories/store-settings.repository.js';

const SETTINGS_ID = 'singleton';

interface SettingsRow {
  companyName: string;
  companyRuc: string;
  companyEmail: string;
  whatsapp: string;
  yapePhone: string;
  yapeQrUrl: string | null;
  paymentWindowHours: number;
  updatedAt: Date;
  bankAccounts: { id: string; bank: string; accountNumber: string; cci: string }[];
}

function toDomain(row: SettingsRow): StoreSettings {
  return new StoreSettings({
    companyName: row.companyName,
    companyRuc: row.companyRuc,
    companyEmail: row.companyEmail,
    whatsapp: row.whatsapp,
    yapePhone: row.yapePhone,
    yapeQrUrl: row.yapeQrUrl,
    paymentWindowHours: row.paymentWindowHours,
    bankAccounts: row.bankAccounts.map((account) => ({
      id: account.id,
      bank: account.bank,
      accountNumber: account.accountNumber,
      cci: account.cci,
    })),
    updatedAt: row.updatedAt,
  });
}

/**
 * Implementacion del puerto sobre PostgreSQL.
 *
 * La fila unica se siembra de forma perezosa en la primera lectura: no hace
 * falta un paso de migracion de datos ni un seed obligatorio, y el valor
 * inicial sale de las mismas variables de entorno que antes vivian en
 * AppConfig, para que actualizar desde una version anterior de la tienda no
 * deje el checkout sin datos de pago.
 */
@Injectable()
export class PrismaStoreSettingsRepository extends StoreSettingsRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    super();
  }

  async get(): Promise<StoreSettings> {
    const row = await this.prisma.storeSettings.findUnique({
      where: { id: SETTINGS_ID },
      include: { bankAccounts: { orderBy: { position: 'asc' } } },
    });

    if (row !== null) return toDomain(row);

    const seeded = await this.prisma.storeSettings.create({
      data: {
        id: SETTINGS_ID,
        companyName: this.config.company.name,
        companyRuc: this.config.company.ruc,
        companyEmail: this.config.company.email,
        whatsapp: this.config.company.whatsapp,
        yapePhone: this.config.company.yapePhone,
        yapeQrUrl: null,
        paymentWindowHours: this.config.paymentWindowHours,
        bankAccounts: {
          create: this.config.company.bankAccounts.map((account, index) => ({
            bank: account.bank,
            accountNumber: account.accountNumber,
            cci: account.cci,
            position: index,
          })),
        },
      },
      include: { bankAccounts: { orderBy: { position: 'asc' } } },
    });

    return toDomain(seeded);
  }

  async update(patch: UpdateStoreSettingsInput, updatedById: string): Promise<StoreSettings> {
    // Se garantiza que la fila exista antes de tocarla: en una instalacion
    // recien creada, la primera edicion desde el panel podria llegar antes de
    // que nadie haya disparado la siembra perezosa con una lectura.
    await this.get();

    const row = await this.prisma.storeSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        companyName: patch.companyName,
        companyRuc: patch.companyRuc,
        companyEmail: patch.companyEmail,
        whatsapp: patch.whatsapp,
        yapePhone: patch.yapePhone,
        yapeQrUrl: patch.yapeQrUrl,
        paymentWindowHours: patch.paymentWindowHours,
        updatedById,
        ...(patch.bankAccounts
          ? {
              // La lista es pequena (unas pocas cuentas) y cambia entera desde
              // un formulario del panel: reemplazarla completa es mas simple y
              // menos propenso a errores que calcular un diff de altas y bajas.
              bankAccounts: {
                deleteMany: {},
                create: patch.bankAccounts.map((account, index) => ({
                  bank: account.bank,
                  accountNumber: account.accountNumber,
                  cci: account.cci,
                  position: index,
                })),
              },
            }
          : {}),
      },
      include: { bankAccounts: { orderBy: { position: 'asc' } } },
    });

    return toDomain(row);
  }
}
