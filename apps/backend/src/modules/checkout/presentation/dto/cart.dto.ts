import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartLineDto {
  @IsUUID()
  variantId!: string;

  // El tope por linea evita que un error de teclado o un script reserven todo
  // el inventario de una talla en una sola peticion.
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class QuoteCartDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines!: CartLineDto[];

  @IsOptional()
  @IsUUID()
  shippingMethodId?: string;
}
