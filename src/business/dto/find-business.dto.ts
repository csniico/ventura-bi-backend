import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

export class FindBusinessDto {
  @IsNotEmpty()
  @IsString()
  search: 'owner' | 'business';

  @ValidateIf((o: FindBusinessDto) => o.search === 'business')
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
