import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BankAccountDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  bank!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(40)
  accountNumber!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(40)
  cci!: string;
}

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  companyRuc?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  companyEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  yapePhone?: string;

  /**
   * Identificador del archivo ya subido a /admin/media que se usara como QR.
   * Null retira el QR actual. El controlador lo traduce a la URL publica: el
   * cliente nunca envia una url a mano, siempre un identificador de un archivo
   * que ya paso por la validacion de subida.
   */
  @IsOptional()
  @IsUUID()
  yapeQrAssetId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  paymentWindowHours?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => BankAccountDto)
  bankAccounts?: BankAccountDto[];
}
