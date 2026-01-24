import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImportCustomerItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsNotEmpty()
  notes?: string;
}
