import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGoogleUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNotEmpty()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
