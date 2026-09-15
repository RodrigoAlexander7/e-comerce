import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/presentation/decorators/roles.decorator.js';
import { PERU_DEPARTMENTS } from '../infrastructure/peru-locations.data.js';

export interface DepartmentView {
  name: string;
  provinces: { name: string; districts: string[] }[];
}

/**
 * Catalogo de ubicaciones para los selectores de direccion del checkout.
 *
 * Se sirve desde el backend y no desde una constante del frontend para que
 * ampliar la cobertura de distritos no obligue a redesplegar la tienda, y para
 * que un futuro panel pueda restringir a que zonas se envia.
 */
@Public()
@Controller('locations')
export class LocationsController {
  @Get('peru')
  peru(): DepartmentView[] {
    return PERU_DEPARTMENTS.map((department) => ({
      name: department.name,
      provinces: department.provinces.map((province) => ({
        name: province.name,
        districts: [...province.districts],
      })),
    }));
  }
}
