import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteCustomerDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;
}
