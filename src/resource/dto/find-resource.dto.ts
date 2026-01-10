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

export class FindResourceDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['product', 'service'])
  type: 'product' | 'service';

  @IsString()
  @IsNotEmpty()
  @IsIn(['one', 'many'])
  filter: 'one' | 'many';

  // Required when filter is 'one'
  @ValidateIf((o: FindResourceDto) => o.filter === 'one')
  @IsNotEmpty({ message: 'resourceId is required when filter is one' })
  @IsUUID()
  resourceId?: string;

  // Optional pagination for 'many'
  @ValidateIf((o: FindResourceDto) => o.filter === 'many')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ValidateIf((o: FindResourceDto) => o.filter === 'many')
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;
}
