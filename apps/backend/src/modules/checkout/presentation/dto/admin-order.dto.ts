import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ORDER_STATUSES } from '../../domain/entities/order.entity.js';

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListOrdersAdminQuery {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  perPage?: string;
}
