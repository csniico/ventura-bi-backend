import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'hasPasswordOrGoogleId', async: false })
export class HasPasswordOrGoogleIdConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments) {
    const obj = args.object as Record<string, unknown>;
    return !!(obj.password || obj.googleId);
  }

  defaultMessage() {
    return 'Either password or googleId must be provided';
  }
}

export function HasPasswordOrGoogleId(
  validationOptions?: Record<string, unknown>,
) {
  return function (target: object, propertyName: string = '') {
    registerDecorator({
      target: target.constructor,
      propertyName,
      validator: HasPasswordOrGoogleIdConstraint,
      options: validationOptions,
    });
  };
}

@HasPasswordOrGoogleId()
export class CreateUserDto {
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

  @ValidateIf((o: Record<string, unknown>) => !o.googleId)
  @IsStrongPassword({
    minLength: 12,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minLowercase: 1,
  })
  @Length(12, 128)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  googleId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^https:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/)
  avatarUrl?: string;
}
