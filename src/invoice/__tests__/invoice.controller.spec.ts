import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { InvoiceController } from '../invoice.controller';
import { InvoiceService } from '../invoice.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import {
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
} from '../entities/invoice.entity';
import { createInvoiceStub } from 'src/common/__tests__/test-factories';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let mockService: jest.Mocked<Partial<InvoiceService>>;

  const mockReq = { user: { userId: 'user-uuid' } };

  beforeEach(async () => {
    mockService = {
      createInvoice: jest.fn(),
      getCustomerInvoices: jest.fn(),
      getInvoices: jest.fn(),
      getInvoiceById: jest.fn(),
      updateInvoicePayment: jest.fn(),
      updateInvoiceStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [{ provide: InvoiceService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InvoiceController>(InvoiceController);
  });

  describe('createInvoice', () => {
    it('defaults invoiceType to STANDARD when not provided', async () => {
      const invoice = createInvoiceStub();
      mockService.createInvoice!.mockResolvedValue(invoice as any);

      await controller.createInvoice(mockReq, {
        businessId: 'business-uuid',
        customerId: 'customer-uuid',
        orderIds: ['order-uuid'],
        dueDate: '2024-12-31',
      } as any);

      expect(mockService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceType: InvoiceType.STANDARD }),
      );
    });

    it('passes provided invoiceType through', async () => {
      const invoice = createInvoiceStub({ invoiceType: InvoiceType.PROFORMA });
      mockService.createInvoice!.mockResolvedValue(invoice as any);

      await controller.createInvoice(mockReq, {
        businessId: 'business-uuid',
        customerId: 'customer-uuid',
        orderIds: ['order-uuid'],
        dueDate: '2024-12-31',
        invoiceType: InvoiceType.PROFORMA,
      } as any);

      expect(mockService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceType: InvoiceType.PROFORMA }),
      );
    });

    it('throws UnauthorizedException when userId missing', async () => {
      await expect(
        controller.createInvoice({ user: {} } as any, {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getCustomerInvoices', () => {
    it('calls getCustomerInvoices with customerId from path param', async () => {
      mockService.getCustomerInvoices!.mockResolvedValue({
        data: [],
        meta: {},
      } as any);

      await controller.getCustomerInvoices(mockReq, 'customer-uuid', {
        businessId: 'business-uuid',
        page: 1,
        limit: 10,
      } as any);

      expect(mockService.getCustomerInvoices).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-uuid',
          ownerId: 'user-uuid',
        }),
      );
    });
  });

  describe('getInvoices', () => {
    it('calls getInvoices with optional status and customerId filters', async () => {
      mockService.getInvoices!.mockResolvedValue({ data: [], meta: {} } as any);

      await controller.getInvoices(mockReq, {
        businessId: 'business-uuid',
        status: InvoiceStatus.PAID,
        customerId: 'customer-uuid',
        page: 1,
        limit: 10,
      } as any);

      expect(mockService.getInvoices).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvoiceStatus.PAID,
          customerId: 'customer-uuid',
        }),
      );
    });
  });

  describe('getInvoiceById', () => {
    it('calls getInvoiceById with invoiceId from path param', async () => {
      const invoice = createInvoiceStub();
      mockService.getInvoiceById!.mockResolvedValue(invoice as any);

      const result = await controller.getInvoiceById(
        mockReq,
        'invoice-uuid',
        'business-uuid',
      );

      expect(mockService.getInvoiceById).toHaveBeenCalledWith({
        invoiceId: 'invoice-uuid',
        businessId: 'business-uuid',
        ownerId: 'user-uuid',
      });
      expect(result).toEqual(invoice);
    });
  });

  describe('updateInvoicePayment', () => {
    it('calls updateInvoicePayment with correct params', async () => {
      const invoice = createInvoiceStub();
      mockService.updateInvoicePayment!.mockResolvedValue(invoice as any);

      await controller.updateInvoicePayment(
        mockReq,
        'invoice-uuid',
        'business-uuid',
        {
          amountPaid: 100,
          paymentMethod: PaymentMethod.CASH,
          paymentDate: null,
        } as any,
      );

      expect(mockService.updateInvoicePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'invoice-uuid',
          businessId: 'business-uuid',
          ownerId: 'user-uuid',
          amountPaid: 100,
          paymentMethod: PaymentMethod.CASH,
        }),
      );
    });
  });

  describe('updateInvoiceStatus', () => {
    it('calls updateInvoiceStatus with correct params', async () => {
      const invoice = createInvoiceStub({ status: InvoiceStatus.SENT });
      mockService.updateInvoiceStatus!.mockResolvedValue(invoice as any);

      await controller.updateInvoiceStatus(
        mockReq,
        'invoice-uuid',
        'business-uuid',
        { status: InvoiceStatus.SENT } as any,
      );

      expect(mockService.updateInvoiceStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'invoice-uuid',
          status: InvoiceStatus.SENT,
        }),
      );
    });
  });
});
