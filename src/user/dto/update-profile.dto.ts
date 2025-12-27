import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^https:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/)
  avatarUrl?: string;
}
