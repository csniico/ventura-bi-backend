import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
