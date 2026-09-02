import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated-client.js';
import { APP_CONFIG, type AppConfig } from '../../../config/app-config.js';

/**
 * Cliente de Prisma gestionado por el ciclo de vida de Nest.
 *
 * Prisma 7 exige un driver adapter explicito: ya no basta con una URL en el
 * schema. Aqui se usa el adaptador nativo de PostgreSQL sobre "pg".
 *
 * Esta clase pertenece a infraestructura. Los casos de uso jamas la inyectan:
 * solo los repositorios concretos la conocen.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexion con PostgreSQL establecida.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
