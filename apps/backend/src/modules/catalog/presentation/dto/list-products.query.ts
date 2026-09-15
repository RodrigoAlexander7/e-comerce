import { Transform, Type } from 'class-transformer';
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { ProductSort } from '../../domain/repositories/product.repository.js';

const SORTS: ProductSort[] = ['newest', 'price_asc', 'price_desc', 'name_asc'];

/** Convierte "S,M,L" en ["S","M","L"], tolerando espacios y valores vacios. */
function toStringArray(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts : undefined;
}

export class ListProductsQuery {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  sizes?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  colors?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsBooleanString()
  inStock?: string;

  @IsOptional()
  @IsBooleanString()
  featured?: string;

  @IsOptional()
  @IsIn(SORTS)
  sort?: ProductSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  // El tope evita que una peticion pida el catalogo entero de una sola vez.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  perPage?: number;
}
