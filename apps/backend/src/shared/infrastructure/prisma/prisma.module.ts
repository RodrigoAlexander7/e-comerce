import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Global porque cada modulo de dominio necesita su repositorio concreto y
 * todos comparten la misma conexion. Solo se exporta el servicio: la decision
 * de que capa puede inyectarlo se hace por convencion de arquitectura.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
