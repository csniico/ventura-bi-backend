import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { ImportCustomerItemDto } from './import-customer-item.dto';

export class ImportCustomersDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportCustomerItemDto)
  customers: ImportCustomerItemDto[];
}
