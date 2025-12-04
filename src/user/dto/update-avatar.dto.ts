import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^https:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/)
  avatarUrl: string;
}
