import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum RecurringFrequency {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  YEARLY = 'yearly',
}

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  description?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === '' ? undefined : value,
  )
  notes?: string;

  @IsBoolean()
  @IsNotEmpty()
  isRecurring: boolean;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: CreateAppointmentDto) => o.isRecurring)
  @IsOptional()
  recurringFrequency?: RecurringFrequency;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: CreateAppointmentDto) => o.isRecurring)
  @IsOptional()
  recurringUntil?: string;
}
