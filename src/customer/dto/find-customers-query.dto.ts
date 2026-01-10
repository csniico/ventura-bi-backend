import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';

export class FindCustomersQueryDto {
  @ValidateIf((o: FindCustomersQueryDto) => o.filter === 'one')
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsOptional()
  @IsString()
  filter: 'one' | 'many';

  @ValidateIf((o: FindCustomersQueryDto) => o.filter === 'many')
  @IsNotEmpty({ message: 'limit is required when filter is set to many' })
  @IsInt()
  @Min(1)
  limit?: number;

  @ValidateIf((o: FindCustomersQueryDto) => o.filter === 'many')
  @IsNotEmpty({ message: 'page is required when filter is set to many' })
  @IsInt()
  @Min(1)
  page?: number;
}
