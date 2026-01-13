import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class GetCustomerOrdersQueryDto {
  @IsUUID()
  businessId: string;

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
