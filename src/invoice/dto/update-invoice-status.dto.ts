import { IsEnum, IsNotEmpty } from 'class-validator';
import { InvoiceStatus } from '../entities/invoice.entity';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  @IsNotEmpty()
  status: InvoiceStatus;
}
