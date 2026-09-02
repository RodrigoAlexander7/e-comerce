import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CartLineDto } from './cart.dto.js';
import { IDENTIFICATION_TYPES } from '../../domain/value-objects/identification.js';
import { PAYMENT_METHODS } from '../../domain/entities/order.entity.js';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  state!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  district!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  apartment?: string;
}

export class PlaceOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines!: CartLineDto[];

  @IsUUID()
  shippingMethodId!: string;

  @IsIn(PAYMENT_METHODS)
  paymentMethod!: (typeof PAYMENT_METHODS)[number];

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  customerName!: string;

  @IsEmail()
  @MaxLength(255)
  customerEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  customerPhone!: string;

  @IsIn(IDENTIFICATION_TYPES)
  idType!: (typeof IDENTIFICATION_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  idNumber!: string;

  // El formulario envia el checkbox como texto; se normaliza antes de validar.
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  needsInvoice!: boolean;

  // La coherencia entre needsInvoice y estos dos campos la impone el objeto de
  // valor InvoiceDetails en el dominio, no el DTO: es una regla de negocio y
  // debe cumplirse aunque la peticion no venga del formulario.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  ruc?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress!: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;
}
