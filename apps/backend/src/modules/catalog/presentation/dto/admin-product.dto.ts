import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsHexColor,
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

export class ProductImageDto {
  @IsString()
  @MaxLength(512)
  url!: string;

  @IsString()
  @MaxLength(255)
  alt!: string;
}

export class VariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsString()
  @MaxLength(16)
  size!: string;

  @IsString()
  @MaxLength(60)
  colorName!: string;

  @IsHexColor()
  colorHex!: string;

  @IsInt()
  @Min(0)
  @Max(100_000)
  stock!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000)
  lowStockThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsUUID()
  categoryId!: string;

  @IsInt()
  @Min(0)
  basePriceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPriceCents?: number | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images!: ProductImageDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants!: VariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  basePriceCents?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsInt()
  @Min(0)
  compareAtPriceCents?: number | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}

export class CreateVariantDto extends VariantDto {}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  colorName?: string;

  @IsOptional()
  @IsHexColor()
  colorHex?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000)
  lowStockThreshold?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsInt()
  @Min(0)
  priceCents?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
