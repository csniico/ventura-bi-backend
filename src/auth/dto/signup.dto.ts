import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
} from 'class-validator';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 25)
  firstName: string;

  @IsString()
  @IsOptional()
  @Length(1, 25)
  lastName?: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 12,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minLowercase: 1,
  })
  @Length(12, 128)
  password: string;

  @IsString()
  @IsOptional()
  @Matches(/^https:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/)
  avatarUrl?: string;
}
