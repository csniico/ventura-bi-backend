import { IsEmail, IsNotEmpty } from 'class-validator';

export class ConfirmEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
