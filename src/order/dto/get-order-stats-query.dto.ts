import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetOrderStatsQueryDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
