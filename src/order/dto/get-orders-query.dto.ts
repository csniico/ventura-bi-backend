import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class GetOrdersQueryDto {
  @IsUUID()
  businessId: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
