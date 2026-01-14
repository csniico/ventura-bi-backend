import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  q: string;

  @IsOptional()
  @IsIn(['on', 'off'])
  filters?: 'on' | 'off';

  @ValidateIf((o: SearchQueryDto) => o.filters === 'on')
  @IsNotEmpty({ message: 'minPrice is required when filters is on' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ValidateIf((o: SearchQueryDto) => o.filters === 'on')
  @IsNotEmpty({ message: 'maxPrice is required when filters is on' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ValidateIf((o: SearchQueryDto) => o.filters === 'on')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minQty?: number;

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
