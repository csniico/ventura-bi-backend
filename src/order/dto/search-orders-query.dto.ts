import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class SearchOrdersQueryDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  q: string;

  @IsOptional()
  @IsIn(['on', 'off'])
  filters?: 'on' | 'off';

  @ValidateIf((o: SearchOrdersQueryDto) => o.filters === 'on')
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ValidateIf((o: SearchOrdersQueryDto) => o.filters === 'on')
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ValidateIf((o: SearchOrdersQueryDto) => o.filters === 'on')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minTotal?: number;

  @ValidateIf((o: SearchOrdersQueryDto) => o.filters === 'on')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;
}
