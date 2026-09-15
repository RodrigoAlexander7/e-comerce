import { Module } from '@nestjs/common';
import { LocationsController } from './presentation/locations.controller.js';

/**
 * Datos de referencia geografica. No tiene dominio ni persistencia propios:
 * es un catalogo estatico de solo lectura, y modelarlo con las cuatro capas
 * completas seria ceremonia sin ninguna regla de negocio que proteger.
 */
@Module({ controllers: [LocationsController] })
export class LocationsModule {}
