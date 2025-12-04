import { IsOptional, IsPositive, Min } from 'class-validator';

export class GetUsersDto {
  @IsOptional()
  @IsPositive()
  limit?: number; //specifies how many records

  @IsOptional()
  @Min(0)
  offset?: number; // how many records to skip
}
