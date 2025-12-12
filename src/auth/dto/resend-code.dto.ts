import { IsNotEmpty, IsString } from 'class-validator';

export class ResendCodeDTO {
  @IsNotEmpty()
  @IsString()
  id: string;
}
