import { IsBoolean } from 'class-validator';

/** Cuerpo comun de los endpoints "activar/desactivar" del panel. */
export class SetActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
