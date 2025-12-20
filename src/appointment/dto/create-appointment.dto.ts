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

enum RecurringSchedule {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  YEARLY = 'yearly',
}

class Recurrence {
  @IsString()
  @IsNotEmpty()
  until: string;

  @IsString()
  @IsNotEmpty()
  schedule: RecurringSchedule;
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
