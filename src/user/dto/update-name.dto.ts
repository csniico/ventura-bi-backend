import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
