import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CustomerController } from '../customer.controller';
import { CustomerService } from '../customer.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { createCustomerStub } from 'src/common/__tests__/test-factories';

describe('CustomerController', () => {
  let controller: CustomerController;
  let mockService: jest.Mocked<Partial<CustomerService>>;

  const mockReq = { user: { userId: 'user-uuid' } };

  beforeEach(async () => {
    mockService = {
      findOne: jest.fn(),
      find: jest.fn(),
      createOne: jest.fn(),
      importCustomers: jest.fn(),
      updateOne: jest.fn(),
      deleteCustomer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [{ provide: CustomerService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CustomerController>(CustomerController);
  });

  describe('getCustomers', () => {
    it('calls findOne when filter=one', async () => {
      const customer = createCustomerStub();
      mockService.findOne!.mockResolvedValue(customer as any);

      const result = await controller.getCustomers(mockReq, {
        filter: 'one',
        customerId: 'customer-uuid',
        businessId: 'business-uuid',
      } as any);

      expect(mockService.findOne).toHaveBeenCalledWith({
        customerId: 'customer-uuid',
        ownerId: 'user-uuid',
        businessId: 'business-uuid',
      });
      expect(result).toEqual(customer);
    });

    it('calls find with defaults when filter=many', async () => {
      const response = { customers: [], total: 0 };
      mockService.find!.mockResolvedValue(response as any);

      await controller.getCustomers(mockReq, {
        filter: 'many',
        businessId: 'business-uuid',
      } as any);

      expect(mockService.find).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, page: 1 }),
      );
    });

    it('throws UnauthorizedException when userId not in request', async () => {
      const badReq = { user: {} } as any;

      await expect(
        controller.getCustomers(badReq, { filter: 'one' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createCustomer', () => {
    it('calls customerService.createOne with ownerId from request', async () => {
      const customer = createCustomerStub();
      mockService.createOne!.mockResolvedValue(customer as any);

      const dto = {
        businessId: 'business-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        notes: null,
      } as any;

      const result = await controller.createCustomer(mockReq, dto);

      expect(mockService.createOne).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-uuid', name: 'John Doe' }),
      );
      expect(result).toEqual(customer);
    });

    it('throws UnauthorizedException when userId missing', async () => {
      await expect(
        controller.createCustomer({ user: {} } as any, {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('importCustomers', () => {
    it('calls customerService.importCustomers', async () => {
      mockService.importCustomers!.mockResolvedValue({
        imported: 1,
        failed: 0,
        customers: [],
      });

      const dto = {
        businessId: 'business-uuid',
        customers: [
          { name: 'John', email: 'john@example.com', phone: null, notes: null },
        ],
      } as any;

      await controller.importCustomers(mockReq, dto);

      expect(mockService.importCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'business-uuid',
          ownerId: 'user-uuid',
        }),
      );
    });
  });

  describe('updateCustomer', () => {
    it('calls customerService.updateOne', async () => {
      const customer = createCustomerStub();
      mockService.updateOne!.mockResolvedValue(customer as any);

      const result = await controller.updateCustomer(mockReq, 'customer-uuid', {
        name: 'Updated Name',
      } as any);

      expect(mockService.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-uuid',
          ownerId: 'user-uuid',
        }),
      );
      expect(result).toEqual(customer);
    });
  });

  describe('deleteCustomer', () => {
    it('calls customerService.deleteCustomer', async () => {
      mockService.deleteCustomer!.mockResolvedValue(undefined);

      await controller.deleteCustomer(
        mockReq,
        'customer-uuid',
        'business-uuid',
      );

      expect(mockService.deleteCustomer).toHaveBeenCalledWith({
        customerId: 'customer-uuid',
        ownerId: 'user-uuid',
        businessId: 'business-uuid',
      });
    });
  });
});
