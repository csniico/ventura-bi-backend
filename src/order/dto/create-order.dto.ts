import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ItemType } from '../entities/order-item.entity';

export class CreateOrderItemDto {
  @IsEnum(ItemType)
  itemType: ItemType;

  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsUUID()
  @IsOptional()
  serviceId?: string;
}

export class CreateOrderDto {
  @IsUUID()
  businessId: string;

  @IsUUID()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
