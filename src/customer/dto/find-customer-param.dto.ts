import { IsNotEmpty, IsUUID } from 'class-validator';

export class FindCustomerParamDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;
}
