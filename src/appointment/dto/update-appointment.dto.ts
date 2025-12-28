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
  userId: string;

  @IsNotEmpty()
  @IsString()
  businessId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
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
