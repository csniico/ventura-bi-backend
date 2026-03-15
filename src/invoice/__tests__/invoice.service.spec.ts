import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceService } from '../invoice.service';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { OrderService } from 'src/order/order.service';
import {
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
} from '../entities/invoice.entity';
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

describe('InvoiceService', () => {
  let service: InvoiceService;
  let invoiceRepo: MockRepository;
  let mockBusinessService: jest.Mocked<Partial<BusinessService>>;
  let mockCustomerService: jest.Mocked<Partial<CustomerService>>;
  let mockOrderService: jest.Mocked<Partial<OrderService>>;
  let mockEventEmitter: { emit: jest.Mock };

  const ownerId = 'user-uuid';
  const businessId = 'business-uuid';
  const customerId = 'customer-uuid';
  const invoiceId = 'invoice-uuid';

  beforeEach(async () => {
    invoiceRepo = createMockRepository();
    mockBusinessService = { findOne: jest.fn() };
    mockCustomerService = { findOne: jest.fn() };
    mockOrderService = {
      getOrderById: jest.fn(),
      linkOrdersToInvoice: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: 'INVOICE_REPOSITORY', useValue: invoiceRepo },
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: OrderService, useValue: mockOrderService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  const setupOwnershipOk = () => {
    mockBusinessService.findOne!.mockResolvedValue(
      createBusinessStub({ ownerId }) as any,
    );
  };

  const completedOrder = () =>
    createOrderStub({
      id: 'order-uuid',
      customerId,
      invoiceId: null,
      status: OrderStatus.COMPLETED,
      totalAmount: 100,
    });

  describe('createInvoice', () => {
    it('throws BadRequestException when no orderIds provided', async () => {
      setupOwnershipOk();

      await expect(
        service.createInvoice({
          businessId,
          customerId,
          orderIds: [],
          dueDate: '2024-12-31',
          notes: null,
          invoiceType: InvoiceType.STANDARD,
          ownerId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('produces validation error when order fetch fails (null order)', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockRejectedValue(new NotFoundException());

      await expect(
        service.createInvoice({
          businessId,
          customerId,
          orderIds: ['missing-order'],
          dueDate: '2024-12-31',
          notes: null,
          invoiceType: InvoiceType.STANDARD,
          ownerId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('produces validation error when order belongs to different customer', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockResolvedValue(
        createOrderStub({
          customerId: 'other-customer',
          invoiceId: null,
          status: OrderStatus.COMPLETED,
        }) as any,
      );

      await expect(
        service.createInvoice({
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

    it('produces validation error when order is already invoiced', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockResolvedValue(
        createOrderStub({
          customerId,
          invoiceId: 'existing-invoice',
          status: OrderStatus.COMPLETED,
        }) as any,
      );

      await expect(
        service.createInvoice({
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

    it('produces validation error for STANDARD type with non-COMPLETED order', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockResolvedValue(
        createOrderStub({
          customerId,
          invoiceId: null,
          status: OrderStatus.PENDING,
        }) as any,
      );

      await expect(
        service.createInvoice({
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

    it('allows PROFORMA type with non-COMPLETED order (no status validation)', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockResolvedValue(
        createOrderStub({
          customerId,
          invoiceId: null,
          status: OrderStatus.PENDING,
          totalAmount: 100,
        }) as any,
      );
      mockCustomerService.findOne!.mockResolvedValue(
        createCustomerStub() as any,
      );
      mockOrderService.linkOrdersToInvoice!.mockResolvedValue({
        success: true,
        linkedOrders: 1,
      });

      const invoice = createInvoiceStub({ invoiceType: InvoiceType.PROFORMA });
      invoiceRepo.create.mockReturnValue(invoice as any);
      invoiceRepo.save.mockResolvedValue(invoice as any);
      invoiceRepo.findOne.mockResolvedValue(invoice as any);

      await expect(
        service.createInvoice({
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

    it('allows RECEIPT type with non-COMPLETED order', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockResolvedValue(
        createOrderStub({
          customerId,
          invoiceId: null,
          status: OrderStatus.PENDING,
          totalAmount: 100,
        }) as any,
      );
      mockCustomerService.findOne!.mockResolvedValue(
        createCustomerStub() as any,
      );
      mockOrderService.linkOrdersToInvoice!.mockResolvedValue({
        success: true,
        linkedOrders: 1,
      });

      const invoice = createInvoiceStub({ invoiceType: InvoiceType.RECEIPT });
      invoiceRepo.create.mockReturnValue(invoice as any);
      invoiceRepo.save.mockResolvedValue(invoice as any);
      invoiceRepo.findOne.mockResolvedValue(invoice as any);

      await expect(
        service.createInvoice({
          businessId,
          customerId,
          orderIds: ['order-uuid'],
          dueDate: '2024-12-31',
          notes: null,
          invoiceType: InvoiceType.RECEIPT,
          ownerId,
        }),
      ).resolves.toBeDefined();
    });

    it('correctly calculates Ghana tax (VAT 15%, NHIL 2.5%, GETFund 2.5%)', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockResolvedValue(completedOrder() as any);
      mockCustomerService.findOne!.mockResolvedValue(
        createCustomerStub() as any,
      );
      mockOrderService.linkOrdersToInvoice!.mockResolvedValue({
        success: true,
        linkedOrders: 1,
      });

      const invoice = createInvoiceStub({
        subtotal: 100,
        vatAmount: 15,
        nhilAmount: 2.5,
        getfundAmount: 2.5,
        totalTax: 20,
        totalAmount: 120,
      });
      invoiceRepo.create.mockReturnValue(invoice as any);
      invoiceRepo.save.mockResolvedValue(invoice as any);
      invoiceRepo.findOne.mockResolvedValue(invoice as any);

      await service.createInvoice({
        businessId,
        customerId,
        orderIds: ['order-uuid'],
        dueDate: '2024-12-31',
        notes: null,
        invoiceType: InvoiceType.STANDARD,
        ownerId,
      });

      expect(invoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vatAmount: 15,
          nhilAmount: 2.5,
          getfundAmount: 2.5,
          totalTax: 20,
          totalAmount: 120,
        }),
      );
    });

    it('happy path: calls linkOrdersToInvoice and emits invoice.created', async () => {
      setupOwnershipOk();
      mockOrderService.getOrderById!.mockResolvedValue(completedOrder() as any);
      mockCustomerService.findOne!.mockResolvedValue(
        createCustomerStub() as any,
      );
      mockOrderService.linkOrdersToInvoice!.mockResolvedValue({
        success: true,
        linkedOrders: 1,
      });

      const invoice = createInvoiceStub();
      invoiceRepo.create.mockReturnValue(invoice as any);
      invoiceRepo.save.mockResolvedValue(invoice as any);
      invoiceRepo.findOne.mockResolvedValue(invoice as any);

      await service.createInvoice({
        businessId,
        customerId,
        orderIds: ['order-uuid'],
        dueDate: '2024-12-31',
        notes: null,
        invoiceType: InvoiceType.STANDARD,
        ownerId,
      });

      expect(mockOrderService.linkOrdersToInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceId: invoice.id }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'invoice.created',
        expect.objectContaining({ invoiceId: invoice.id }),
      );
    });
  });

  describe('updateInvoicePayment', () => {
    it('throws BadRequestException when payment exceeds total', async () => {
      setupOwnershipOk();
      invoiceRepo.findOne.mockResolvedValue(
        createInvoiceStub({ totalAmount: 100, amountPaid: 0 }) as any,
      );

      await expect(
        service.updateInvoicePayment({
          invoiceId,
          businessId,
          ownerId,
          amountPaid: 150,
          paymentMethod: PaymentMethod.CASH,
          paymentDate: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets status to PAID and emits invoice.paid on full payment', async () => {
      setupOwnershipOk();
      const invoice = createInvoiceStub({ totalAmount: 120, amountPaid: 0 });
      invoiceRepo.findOne.mockResolvedValue(invoice as any);
      const paidInvoice = {
        ...invoice,
        status: InvoiceStatus.PAID,
        amountPaid: 120,
      };
      invoiceRepo.save.mockResolvedValue(paidInvoice as any);

      await service.updateInvoicePayment({
        invoiceId,
        businessId,
        ownerId,
        amountPaid: 120,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: null,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'invoice.paid',
        expect.objectContaining({ invoiceId }),
      );
    });

    it('sets status to PARTIALLY_PAID and does NOT emit invoice.paid on partial payment', async () => {
      setupOwnershipOk();
      const invoice = createInvoiceStub({ totalAmount: 120, amountPaid: 0 });
      invoiceRepo.findOne.mockResolvedValue(invoice as any);
      const partialInvoice = {
        ...invoice,
        status: InvoiceStatus.PARTIALLY_PAID,
        amountPaid: 60,
      };
      invoiceRepo.save.mockResolvedValue(partialInvoice as any);

      await service.updateInvoicePayment({
        invoiceId,
        businessId,
        ownerId,
        amountPaid: 60,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: null,
      });

      const emitCalls = mockEventEmitter.emit.mock.calls.map(
        ([event]) => event,
      );
      expect(emitCalls).not.toContain('invoice.paid');
    });
  });

  describe('updateInvoiceStatus', () => {
    it('emits invoice.cancelled when status set to CANCELLED', async () => {
      setupOwnershipOk();
      const invoice = createInvoiceStub({ status: InvoiceStatus.DRAFT });
      invoiceRepo.findOne.mockResolvedValue(invoice as any);
      invoiceRepo.save.mockResolvedValue({
        ...invoice,
        status: InvoiceStatus.CANCELLED,
      } as any);

      await service.updateInvoiceStatus({
        invoiceId,
        businessId,
        ownerId,
        status: InvoiceStatus.CANCELLED,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'invoice.cancelled',
        expect.objectContaining({ invoiceId }),
      );
    });

    it('does NOT emit any event when status set to SENT', async () => {
      setupOwnershipOk();
      const invoice = createInvoiceStub({ status: InvoiceStatus.DRAFT });
      invoiceRepo.findOne.mockResolvedValue(invoice as any);
      invoiceRepo.save.mockResolvedValue({
        ...invoice,
        status: InvoiceStatus.SENT,
      } as any);

      await service.updateInvoiceStatus({
        invoiceId,
        businessId,
        ownerId,
        status: InvoiceStatus.SENT,
      });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getInvoiceById', () => {
    it('throws NotFoundException when invoice not found', async () => {
      setupOwnershipOk();
      invoiceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getInvoiceById({ invoiceId, businessId, ownerId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns invoice when found', async () => {
      setupOwnershipOk();
      const invoice = createInvoiceStub();
      invoiceRepo.findOne.mockResolvedValue(invoice as any);

      const result = await service.getInvoiceById({
        invoiceId,
        businessId,
        ownerId,
      });

      expect(result).toEqual(invoice);
    });
  });

  describe('verifyBusinessOwnership', () => {
    it('throws UnauthorizedException when ownerId is missing', async () => {
      await expect(
        service.getInvoiceById({ invoiceId, businessId, ownerId: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
