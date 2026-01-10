import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  primaryImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingImages?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  availableQuantity?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
}
