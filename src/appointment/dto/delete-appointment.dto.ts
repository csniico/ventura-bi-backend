import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
