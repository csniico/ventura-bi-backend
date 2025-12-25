import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum RecurringFrequency {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  BI_MONTHLY = 'bi-monthly',
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi-weekly',
  YEARLY = 'yearly',
}

export class Recurrence {
  @IsString()
  @IsNotEmpty()
  until: string;

  @IsString()
  @IsNotEmpty()
  frequency: RecurringFrequency;
}

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  businessId: string;

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

  @IsObject()
  @ValidateNested()
  @Type(() => Recurrence)
  @ValidateIf((o: CreateAppointmentDto) => o.isRecurring)
  @IsOptional()
  recurringSchedule?: Recurrence;
}
