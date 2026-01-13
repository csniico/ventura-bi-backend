import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  orderIds: string[];

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
