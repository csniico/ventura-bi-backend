import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../entities/invoice.entity';

export class UpdateInvoicePaymentDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amountPaid: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}
