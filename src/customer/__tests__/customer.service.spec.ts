import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerService } from '../customer.service';
import { BusinessService } from 'src/business/business.service';
import { CUSTOMER_REPOSITORY } from 'src/constants';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createBusinessStub,
  createCustomerStub,
} from 'src/common/__tests__/test-factories';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepo: MockRepository;
  let mockBusinessService: jest.Mocked<Partial<BusinessService>>;
  let mockEventEmitter: { emit: jest.Mock };

  const ownerId = 'user-uuid';
  const businessId = 'business-uuid';
  const customerId = 'customer-uuid';

  beforeEach(async () => {
    customerRepo = createMockRepository();
    mockBusinessService = {
      findOne: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: CUSTOMER_REPOSITORY, useValue: customerRepo },
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  const setupOwnershipOk = () => {
    mockBusinessService.findOne!.mockResolvedValue(
      createBusinessStub({ ownerId }) as any,
    );
  };

  describe('findOne', () => {
    it('returns customer when ownership verified', async () => {
      setupOwnershipOk();
      const customer = createCustomerStub();
      customerRepo.findOne.mockResolvedValue(customer);

      const result = await service.findOne({ customerId, ownerId, businessId });

      expect(result).toEqual(customer);
    });

    it('throws UnauthorizedException when business not owned by user', async () => {
      mockBusinessService.findOne!.mockResolvedValue(
        createBusinessStub({ ownerId: 'other-user' }) as any,
      );

      await expect(
        service.findOne({ customerId, ownerId, businessId }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when customer not found (info leakage mitigation)', async () => {
      setupOwnershipOk();
      customerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne({ customerId, ownerId, businessId }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when ownerId is missing', async () => {
      await expect(
        service.findOne({ customerId, ownerId: '', businessId }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('find', () => {
    it('returns paginated customers', async () => {
      setupOwnershipOk();
      const customers = [createCustomerStub()];
      customerRepo.findAndCount.mockResolvedValue([customers, 1]);

      const result = await service.find({
        ownerId,
        businessId,
        limit: 10,
        page: 2,
      });

      expect(result).toEqual({ customers, total: 1 });
      expect(customerRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10, // (page-1) * limit = 1 * 10
          where: { businessId },
        }),
      );
    });
  });

  describe('createOne', () => {
    it('creates and returns customer, emits customer.created event', async () => {
      setupOwnershipOk();
      customerRepo.findOne.mockResolvedValue(null); // no duplicate
      const customer = createCustomerStub();
      customerRepo.create.mockReturnValue(customer as any);
      customerRepo.save.mockResolvedValue(customer as any);

      const result = await service.createOne({
        ownerId,
        businessId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        notes: null,
      });

      expect(result).toEqual(customer);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'customer.created',
        expect.objectContaining({ customerId: customer.id }),
      );
    });

    it('throws ConflictException when email already exists for business', async () => {
      setupOwnershipOk();
      customerRepo.findOne.mockResolvedValue(createCustomerStub() as any);

      await expect(
        service.createOne({
          ownerId,
          businessId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: null,
          notes: null,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('skips duplicate email check when email is empty', async () => {
      setupOwnershipOk();
      const customer = createCustomerStub({ email: null });
      customerRepo.create.mockReturnValue(customer as any);
      customerRepo.save.mockResolvedValue(customer as any);

      await service.createOne({
        ownerId,
        businessId,
        name: 'John Doe',
        email: '',
        phone: null,
        notes: null,
      });

      // findOne for duplicate check should NOT have been called since email is empty
      expect(customerRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateOne', () => {
    it('throws ConflictException when updating to email belonging to a different customer', async () => {
      const otherCustomer = createCustomerStub({ id: 'other-customer-id' });
      customerRepo.findOne.mockResolvedValueOnce(otherCustomer as any);

      await expect(
        service.updateOne({
          customerId,
          ownerId,
          payload: {
            businessId,
            email: 'taken@example.com',
          },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('does not throw when customer updates their own email', async () => {
      setupOwnershipOk();
      const sameCustomer = createCustomerStub({ id: customerId });
      customerRepo.findOne
        .mockResolvedValueOnce(sameCustomer as any) // duplicate check returns same customer
        .mockResolvedValue(sameCustomer as any); // findOne for return
      customerRepo.update.mockResolvedValue({ affected: 1 } as any);

      await expect(
        service.updateOne({
          customerId,
          ownerId,
          payload: { businessId, email: 'john@example.com' },
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('deleteCustomer', () => {
    it('removes customer and emits customer.deleted event', async () => {
      setupOwnershipOk();
      const customer = createCustomerStub();
      customerRepo.findOne.mockResolvedValue(customer as any);
      customerRepo.remove.mockResolvedValue(customer as any);

      await service.deleteCustomer({ customerId, ownerId, businessId });

      expect(customerRepo.remove).toHaveBeenCalledWith(customer);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'customer.deleted',
        expect.objectContaining({ customerId }),
      );
    });
  });

  describe('importCustomers', () => {
    it('returns correct imported/failed counts when some saves fail', async () => {
      setupOwnershipOk();
      const c1 = createCustomerStub({ id: 'c1' });
      const c2 = createCustomerStub({ id: 'c2', name: 'Jane' });
      customerRepo.create
        .mockReturnValueOnce(c1 as any)
        .mockReturnValueOnce(c2 as any);
      customerRepo.save
        .mockResolvedValueOnce(c1 as any)
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await service.importCustomers({
        ownerId,
        businessId,
        customers: [
          { name: 'John', email: 'john@example.com', phone: null, notes: null },
          { name: 'Jane', email: 'jane@example.com', phone: null, notes: null },
        ],
      });

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.customers).toHaveLength(1);
    });

    it('returns all imported when all succeed', async () => {
      setupOwnershipOk();
      const customers = [
        createCustomerStub(),
        createCustomerStub({ id: 'c2' }),
      ];
      customers.forEach((c) => {
        customerRepo.create.mockReturnValueOnce(c as any);
        customerRepo.save.mockResolvedValueOnce(c as any);
      });

      const result = await service.importCustomers({
        ownerId,
        businessId,
        customers: [
          { name: 'John', email: 'john@example.com', phone: null, notes: null },
          { name: 'Jane', email: 'jane@example.com', phone: null, notes: null },
        ],
      });

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  describe('customerExists', () => {
    it('throws UnauthorizedException when customer does not exist', async () => {
      customerRepo.exists.mockResolvedValue(false);

      await expect(service.customerExists(customerId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('does not throw when customer exists', async () => {
      customerRepo.exists.mockResolvedValue(true);

      await expect(service.customerExists(customerId)).resolves.not.toThrow();
    });
  });
});
