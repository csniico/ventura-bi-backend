import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { BusinessService } from 'src/business/business.service';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: Repository<Customer>,
    @Inject()
    private readonly businessService: BusinessService,
  ) {}

  async findOneByCustomerId(customerId: string) {
    return await this.customerRepository.findOne({ where: { id: customerId } });
  }

  async findByBusinessId(businessId: string) {
    return await this.customerRepository.find({ where: { businessId } });
  }

  async createOne(dto: CreateCustomerDto) {
    const { businessId } = dto;
    const business = await this.businessService.findOne(businessId);
    if (!business) {
      throw new Error('Business not found');
    }
    const new_customer = this.customerRepository.create({
      name: dto.name,
      businessId: businessId,
      email: dto.email,
      phone: dto.phone,
      notes: dto.notes,
    });

    return await this.customerRepository.save(new_customer);
  }

  async updateOne({
    customerId,
    payload,
  }: {
    customerId: string;
    payload: CreateCustomerDto;
  }) {
    const customer = await this.findOneByCustomerId(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    Object.assign(customer, payload);
    return await this.customerRepository.save(customer);
  }

  async deleteCustomer() {}
}
