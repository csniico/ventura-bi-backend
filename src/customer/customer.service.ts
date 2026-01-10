import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { BusinessService } from 'src/business/business.service';
import {
  ICreateCustomerParams,
  IDeleteCustomerParams,
  IFindCustomersParams,
  IFindCustomersResults,
  IFindOneCustomerParams,
  IUpdateCustomerParams,
  IVerifyOwnershipParams,
} from './interfaces/customer.interfaces';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: Repository<Customer>,
    @Inject()
    private readonly businessService: BusinessService,
  ) {}

  /**
   * Verifies the user making the request owns the business
   * @param params - parameters for ownership verification of the interface {@link IVerifyOwnershipParams}
   * @returns {Promise<void>} - resolves if ownership is verified, otherwise throws UnauthorizedException
   */
  private async verifyOwnership(params: IVerifyOwnershipParams): Promise<void> {
    const { businessId, ownerId } = params;

    if (!ownerId || !businessId) {
      this.logger.warn(
        `Ownership verification failed: Missing ownerId or businessId`,
      );
      throw new UnauthorizedException(
        'You do not have permission to access this customer',
      );
    }

    const business = await this.businessService.findOne({ businessId });

    if (!business) {
      throw new NotFoundException(
        'The business is either blocked or does not exist',
      );
    }
    const isVerifiedOwner = business.ownerId === ownerId;

    if (!isVerifiedOwner) {
      this.logger.warn('Unauthorized attempt to access customer data');
      throw new UnauthorizedException(
        'You do not have permission to access this customer',
      );
    }
  }

  /**
   * retireves a customer by their customer ID after verifying ownership
   * @param params params for finding one customer of a business {@link IFindOneCustomerParams}
   * @returns {Promise<Customer} - resolves to customer or unauthorized exception
   */
  async findOne(params: IFindOneCustomerParams): Promise<Customer> {
    const { customerId, ownerId, businessId } = params;

    await this.verifyOwnership({ businessId, ownerId });

    const customer = await this.customerRepository.findOne({
      where: { id: customerId, businessId: businessId },
    });

    if (!customer) {
      this.logger.warn('Attempted to access non-existing customer');
      throw new UnauthorizedException(
        'You do not have permission to access this customer',
      ); //Mitigate information leakage
    }
    return customer;
  }

  /**
   * finds a customer by their customer ID
   * @param params params for finding customers of a business by page {@link IFindCustomersParams}
   * @returns {Promise<IFindCustomersResults>} - resolves to customers and total count or unauthorized exception
   */
  async find(params: IFindCustomersParams): Promise<IFindCustomersResults> {
    const { ownerId, businessId, limit, page } = params;
    await this.verifyOwnership({ businessId, ownerId });
    const [customers, total] = await this.customerRepository.findAndCount({
      where: { businessId },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { customers, total };
  }

  /**
   * creates a new customer after verifying ownership
   * @param params params for creating a new customer {@link ICreateCustomerParams}
   * @returns {Promise<Customer>} resolves the newly created customer or unauthorized exception
   */
  async createOne(params: ICreateCustomerParams): Promise<Customer> {
    await this.verifyOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const new_customer = this.customerRepository.create({
      name: params.name,
      businessId: params.businessId,
      email: params.email,
      phone: params.phone,
      notes: params.notes,
    });

    return await this.customerRepository.save(new_customer);
  }

  /**
   * updates a customer after verifying ownership
   * @param params params for updating a customer {@link IUpdateCustomerParams}
   * @returns {Promise<Customer>} - resolves to updated customer or unauthorized exception
   */
  async updateOne(params: IUpdateCustomerParams): Promise<Customer> {
    const customer = await this.findOne({
      customerId: params.customerId,
      ownerId: params.ownerId,
      businessId: params.payload.businessId ?? '',
    });
    Object.assign(customer, params.payload);
    return await this.customerRepository.save(customer);
  }

  /**
   * deletes a customer after verifying ownership
   * @param params params for deleting a customer {@link IDeleteCustomerParams}
   * @returns {Promise<void>} - resolves when deletion is complete or unauthorized exception
   */
  async deleteCustomer(params: IDeleteCustomerParams): Promise<void> {
    const customer = await this.findOne({
      customerId: params.customerId,
      ownerId: params.ownerId,
      businessId: params.businessId,
    });
    await this.customerRepository.remove(customer);
  }
}
