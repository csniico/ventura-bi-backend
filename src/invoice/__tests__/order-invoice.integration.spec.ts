import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceService } from '../invoice.service';
import { OrderService } from 'src/order/order.service';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { ResourceService } from 'src/resource/resource.service';
import { UserService } from 'src/user/user.service';
import {
  INVOICE_REPOSITORY,
  ORDERS_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  BUSINESS_REPOSITORY,
  CUSTOMER_REPOSITORY,
  PRODUCT_REPOSITORY,
  SERVICE_REPOSITORY,
} from 'src/constants';
import { InvoiceType } from '../entities/invoice.entity';
import { OrderStatus } from 'src/order/entities/order.entity';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createBusinessStub,
  createCustomerStub,
  createInvoiceStub,
  createOrderStub,
} from 'src/common/__tests__/test-factories';

describe('Invoice + Order Integration', () => {
  let invoiceService: InvoiceService;
  let invoiceRepo: MockRepository;
  let orderRepo: MockRepository;
  let businessRepo: MockRepository;
  let customerRepo: MockRepository;

  const ownerId = 'user-uuid';
  const businessId = 'business-uuid';
  const customerId = 'customer-uuid';

  beforeEach(async () => {
    invoiceRepo = createMockRepository();
    orderRepo = createMockRepository();
    businessRepo = createMockRepository();
    customerRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        OrderService,
        BusinessService,
        CustomerService,
        ResourceService,
        { provide: 'INVOICE_REPOSITORY', useValue: invoiceRepo },
        { provide: ORDERS_REPOSITORY, useValue: orderRepo },
        { provide: ORDER_ITEM_REPOSITORY, useValue: createMockRepository() },
        { provide: BUSINESS_REPOSITORY, useValue: businessRepo },
        { provide: CUSTOMER_REPOSITORY, useValue: customerRepo },
        { provide: PRODUCT_REPOSITORY, useValue: createMockRepository() },
        { provide: SERVICE_REPOSITORY, useValue: createMockRepository() },
        {
          provide: UserService,
          useValue: { findUserById: jest.fn(), saveUser: jest.fn() },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    invoiceService = module.get<InvoiceService>(InvoiceService);
  });

  const setupOwnership = () => {
    businessRepo.findOne.mockResolvedValue(
      createBusinessStub({ ownerId }) as any,
    );
  };

  describe('createInvoice via real OrderService', () => {
    it('STANDARD type rejects non-COMPLETED order via real OrderService validation', async () => {
      setupOwnership();
      const pendingOrder = createOrderStub({
        customerId,
        invoiceId: null,
        status: OrderStatus.PENDING,
      });
      orderRepo.findOne.mockResolvedValue(pendingOrder as any);

      await expect(
        invoiceService.createInvoice({
          businessId,
          customerId,
          orderIds: ['order-uuid'],
          dueDate: '2024-12-31',
          notes: null,
          invoiceType: InvoiceType.STANDARD,
          ownerId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('PROFORMA type allows non-COMPLETED order via real OrderService', async () => {
      setupOwnership();
      const pendingOrder = createOrderStub({
        customerId,
        invoiceId: null,
        status: OrderStatus.PENDING,
        totalAmount: 100,
      });
      orderRepo.findOne
        .mockResolvedValueOnce(pendingOrder as any) // getOrderById
        .mockResolvedValueOnce(pendingOrder as any); // linkOrdersToInvoice

      customerRepo.findOne.mockResolvedValue(createCustomerStub() as any);

      const invoice = createInvoiceStub({ invoiceType: InvoiceType.PROFORMA });
      invoiceRepo.create.mockReturnValue(invoice as any);
      invoiceRepo.save.mockResolvedValue(invoice as any);
      invoiceRepo.findOne.mockResolvedValue(invoice as any);

      orderRepo.save.mockResolvedValue({
        ...pendingOrder,
        invoiceId: invoice.id,
      } as any);

      await expect(
        invoiceService.createInvoice({
          businessId,
          customerId,
          orderIds: ['order-uuid'],
          dueDate: '2024-12-31',
          notes: null,
          invoiceType: InvoiceType.PROFORMA,
          ownerId,
        }),
      ).resolves.toBeDefined();
    });

    it('linkOrdersToInvoice sets invoiceId on order after successful invoice save', async () => {
      setupOwnership();
      const completedOrder = createOrderStub({
        customerId,
        invoiceId: null,
        status: OrderStatus.COMPLETED,
        totalAmount: 100,
      });
      orderRepo.findOne
        .mockResolvedValueOnce(completedOrder as any) // getOrderById
        .mockResolvedValueOnce(completedOrder as any); // linkOrdersToInvoice findOne

      customerRepo.findOne.mockResolvedValue(createCustomerStub() as any);

      const invoice = createInvoiceStub();
      invoiceRepo.create.mockReturnValue(invoice as any);
      invoiceRepo.save.mockResolvedValue(invoice as any);
      invoiceRepo.findOne.mockResolvedValue(invoice as any);

      orderRepo.save.mockResolvedValue({
        ...completedOrder,
        invoiceId: invoice.id,
      } as any);

      await invoiceService.createInvoice({
        businessId,
        customerId,
        orderIds: [completedOrder.id],
        dueDate: '2024-12-31',
        notes: null,
        invoiceType: InvoiceType.STANDARD,
        ownerId,
      });

      // Verify orderRepo.save was called with the invoiceId linked
      expect(orderRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceId: invoice.id }),
      );
    });
  });
});
