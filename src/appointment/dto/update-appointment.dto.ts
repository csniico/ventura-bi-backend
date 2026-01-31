import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { RecurringFrequency } from 'src/appointment/dto/create-appointment.dto';

export class UpdateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsNotEmpty()
  @IsBoolean()
  isRecurring: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: UpdateAppointmentDto) => o.isRecurring)
  @IsOptional()
  recurringFrequency?: RecurringFrequency;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: UpdateAppointmentDto) => o.isRecurring)
  @IsOptional()
  recurringUntil?: string;
}
