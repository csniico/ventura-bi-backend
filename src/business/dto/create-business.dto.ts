import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsEmpty,
  ValidateIf,
} from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  categories: string[];

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => o.email !== '')
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  tagLine?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @IsEmpty()
  id: string;

  @IsString()
  @IsOptional()
  @IsEmpty()
  shortId: string;
}
