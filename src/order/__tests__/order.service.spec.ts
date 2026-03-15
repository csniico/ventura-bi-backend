import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from '../order.service';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { ResourceService } from 'src/resource/resource.service';
import { ORDER_ITEM_REPOSITORY, ORDERS_REPOSITORY } from 'src/constants';
import { OrderStatus } from '../entities/order.entity';
import { ItemType } from '../entities/order-item.entity';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createBusinessStub,
  createCustomerStub,
  createOrderItemStub,
  createOrderStub,
  createProductStub,
  createServiceStub,
} from 'src/common/__tests__/test-factories';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepo: MockRepository;
  let orderItemRepo: MockRepository;
  let mockBusinessService: jest.Mocked<Partial<BusinessService>>;
  let mockCustomerService: jest.Mocked<Partial<CustomerService>>;
  let mockResourceService: jest.Mocked<Partial<ResourceService>>;
  let mockEventEmitter: { emit: jest.Mock };

  const ownerId = 'user-uuid';
  const businessId = 'business-uuid';
  const orderId = 'order-uuid';

  beforeEach(async () => {
    orderRepo = createMockRepository();
    orderItemRepo = createMockRepository();
    mockBusinessService = { findOne: jest.fn() };
    mockCustomerService = { findOne: jest.fn() };
    mockResourceService = {
      findOneProduct: jest.fn(),
      findOneService: jest.fn(),
      updateProductInventory: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: ORDERS_REPOSITORY, useValue: orderRepo },
        { provide: ORDER_ITEM_REPOSITORY, useValue: orderItemRepo },
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: ResourceService, useValue: mockResourceService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  const setupOwnershipOk = () => {
    mockBusinessService.findOne!.mockResolvedValue(
      createBusinessStub({ ownerId }) as any,
    );
  };

  describe('createOrder', () => {
    it('creates order with PRODUCT item, decrements inventory, emits order.created', async () => {
      setupOwnershipOk();
      const product = createProductStub();
      mockResourceService.findOneProduct!.mockResolvedValue(product as any);
      mockResourceService.updateProductInventory!.mockResolvedValue(
        product as any,
      );

      const orderItem = createOrderItemStub({ subTotal: 100 });
      orderItemRepo.create.mockReturnValue(orderItem as any);
      orderItemRepo.save.mockResolvedValue(orderItem as any);

      const order = createOrderStub({ totalAmount: 100 });
      orderRepo.create.mockReturnValue(order as any);
      orderRepo.save.mockResolvedValue(order as any);

      const result = await service.createOrder({
        businessId,
        ownerId,
        items: [
          {
            itemType: ItemType.PRODUCT,
            productId: 'product-uuid',
            name: 'Test Product',
            price: 50,
            quantity: 2,
          },
        ],
      });

      expect(mockResourceService.updateProductInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-uuid',
          quantityChange: -2,
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({ orderId: order.id }),
      );
      expect(result).toEqual(order);
    });

    it('creates order with SERVICE item and does NOT call updateProductInventory', async () => {
      setupOwnershipOk();
      const svc = createServiceStub();
      mockResourceService.findOneService!.mockResolvedValue(svc as any);

      const orderItem = createOrderItemStub({
        itemType: ItemType.SERVICE,
        subTotal: 60,
      });
      orderItemRepo.create.mockReturnValue(orderItem as any);
      orderItemRepo.save.mockResolvedValue(orderItem as any);

      const order = createOrderStub({ totalAmount: 60 });
      orderRepo.create.mockReturnValue(order as any);
      orderRepo.save.mockResolvedValue(order as any);

      await service.createOrder({
        businessId,
        ownerId,
        items: [
          {
            itemType: ItemType.SERVICE,
            serviceId: 'service-uuid',
            name: 'Test Service',
            price: 60,
            quantity: 1,
          },
        ],
      });

      expect(mockResourceService.updateProductInventory).not.toHaveBeenCalled();
    });

    it('throws NotFoundException with errors when product not found', async () => {
      setupOwnershipOk();
      mockResourceService.findOneProduct!.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        service.createOrder({
          businessId,
          ownerId,
          items: [
            {
              itemType: ItemType.PRODUCT,
              productId: 'bad-product-id',
              name: 'Ghost Product',
              price: 10,
              quantity: 1,
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('fetches customer snapshot when customerId is provided', async () => {
      setupOwnershipOk();
      const product = createProductStub();
      mockResourceService.findOneProduct!.mockResolvedValue(product as any);
      mockResourceService.updateProductInventory!.mockResolvedValue(
        product as any,
      );

      const customer = createCustomerStub();
      mockCustomerService.findOne!.mockResolvedValue(customer as any);

      const orderItem = createOrderItemStub({ subTotal: 50 });
      orderItemRepo.create.mockReturnValue(orderItem as any);
      orderItemRepo.save.mockResolvedValue(orderItem as any);

      const order = createOrderStub();
      orderRepo.create.mockReturnValue(order as any);
      orderRepo.save.mockResolvedValue(order as any);

      await service.createOrder({
        businessId,
        ownerId,
        customerId: 'customer-uuid',
        items: [
          {
            itemType: ItemType.PRODUCT,
            productId: 'product-uuid',
            name: 'Test Product',
            price: 50,
            quantity: 1,
          },
        ],
      });

      expect(mockCustomerService.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'customer-uuid' }),
      );
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: customer.name,
          customerEmail: customer.email,
        }),
      );
    });

    it('does NOT fetch customer when customerId is not provided', async () => {
      setupOwnershipOk();
      const product = createProductStub();
      mockResourceService.findOneProduct!.mockResolvedValue(product as any);
      mockResourceService.updateProductInventory!.mockResolvedValue(
        product as any,
      );

      const orderItem = createOrderItemStub({ subTotal: 50 });
      orderItemRepo.create.mockReturnValue(orderItem as any);
      orderItemRepo.save.mockResolvedValue(orderItem as any);

      const order = createOrderStub({ customerId: null });
      orderRepo.create.mockReturnValue(order as any);
      orderRepo.save.mockResolvedValue(order as any);

      await service.createOrder({
        businessId,
        ownerId,
        items: [
          {
            itemType: ItemType.PRODUCT,
            productId: 'product-uuid',
            name: 'Test Product',
            price: 50,
            quantity: 1,
          },
        ],
      });

      expect(mockCustomerService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    it('emits order.status.changed + order.cancelled when status is CANCELLED', async () => {
      setupOwnershipOk();
      const order = createOrderStub({ status: OrderStatus.PENDING });
      orderRepo.findOne.mockResolvedValue(order as any);
      orderRepo.save.mockResolvedValue({
        ...order,
        status: OrderStatus.CANCELLED,
      } as any);

      await service.updateOrderStatus({
        orderId,
        businessId,
        ownerId,
        status: OrderStatus.CANCELLED,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.status.changed',
        expect.objectContaining({ orderId: order.id }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.cancelled',
        expect.objectContaining({ orderId: order.id }),
      );
    });

    it('emits order.status.changed + order.completed when status is COMPLETED', async () => {
      setupOwnershipOk();
      const order = createOrderStub({ status: OrderStatus.PENDING });
      orderRepo.findOne.mockResolvedValue(order as any);
      orderRepo.save.mockResolvedValue({
        ...order,
        status: OrderStatus.COMPLETED,
      } as any);

      await service.updateOrderStatus({
        orderId,
        businessId,
        ownerId,
        status: OrderStatus.COMPLETED,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.completed',
        expect.any(Object),
      );
    });

    it('emits only order.status.changed when status is PENDING', async () => {
      setupOwnershipOk();
      const order = createOrderStub({ status: OrderStatus.CANCELLED });
      orderRepo.findOne.mockResolvedValue(order as any);
      orderRepo.save.mockResolvedValue({
        ...order,
        status: OrderStatus.PENDING,
      } as any);

      await service.updateOrderStatus({
        orderId,
        businessId,
        ownerId,
        status: OrderStatus.PENDING,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.status.changed',
        expect.any(Object),
      );
    });

    it('throws NotFoundException when order not found', async () => {
      setupOwnershipOk();
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus({
          orderId,
          businessId,
          ownerId,
          status: OrderStatus.CANCELLED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrderById', () => {
    it('throws NotFoundException when order not found', async () => {
      setupOwnershipOk();
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getOrderById({ orderId, businessId, ownerId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns order when found', async () => {
      setupOwnershipOk();
      const order = createOrderStub();
      orderRepo.findOne.mockResolvedValue(order as any);

      const result = await service.getOrderById({
        orderId,
        businessId,
        ownerId,
      });

      expect(result).toEqual(order);
    });
  });

  describe('linkOrdersToInvoice', () => {
    it('updates each order with invoiceId', async () => {
      setupOwnershipOk();
      const order = createOrderStub({ invoiceId: null });
      orderRepo.findOne.mockResolvedValue(order as any);
      orderRepo.save.mockResolvedValue({
        ...order,
        invoiceId: 'invoice-uuid',
      } as any);

      const result = await service.linkOrdersToInvoice({
        orderIds: ['order-uuid'],
        invoiceId: 'invoice-uuid',
        businessId,
        ownerId,
      });

      expect(orderRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ invoiceId: 'invoice-uuid' }),
      );
      expect(result).toEqual({ success: true, linkedOrders: 1 });
    });

    it('throws NotFoundException when order not found during linking', async () => {
      setupOwnershipOk();
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.linkOrdersToInvoice({
          orderIds: ['missing-order'],
          invoiceId: 'invoice-uuid',
          businessId,
          ownerId,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyBusinessOwnership', () => {
    it('throws UnauthorizedException when ownerId is missing', async () => {
      await expect(
        service.getOrderById({ orderId, businessId, ownerId: '' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
