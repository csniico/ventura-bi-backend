import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateGoogleEvent {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsOptional()
  googleEventId?: string;
}
