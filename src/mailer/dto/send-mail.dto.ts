import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  recipients: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  htmlBody: string;

  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];
}
