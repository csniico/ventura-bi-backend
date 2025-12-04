import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  htmlBody: string;

  @IsString()
  @IsOptional()
  cc?: string;
}
