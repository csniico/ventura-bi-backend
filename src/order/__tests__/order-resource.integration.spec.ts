import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from '../order.service';
import { ResourceService } from 'src/resource/resource.service';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { UserService } from 'src/user/user.service';
import {
  ORDER_ITEM_REPOSITORY,
  ORDERS_REPOSITORY,
  PRODUCT_REPOSITORY,
  SERVICE_REPOSITORY,
  BUSINESS_REPOSITORY,
  CUSTOMER_REPOSITORY,
} from 'src/constants';
import { ItemType } from '../entities/order-item.entity';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createBusinessStub,
  createOrderItemStub,
  createOrderStub,
  createProductStub,
  createServiceStub,
} from 'src/common/__tests__/test-factories';

describe('Order + Resource Integration', () => {
  let orderService: OrderService;
  let orderRepo: MockRepository;
  let orderItemRepo: MockRepository;
  let productRepo: MockRepository;
  let serviceRepo: MockRepository;
  let businessRepo: MockRepository;
  let customerRepo: MockRepository;

  const ownerId = 'user-uuid';
  const businessId = 'business-uuid';

  beforeEach(async () => {
    orderRepo = createMockRepository();
    orderItemRepo = createMockRepository();
    productRepo = createMockRepository();
    serviceRepo = createMockRepository();
    businessRepo = createMockRepository();
    customerRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        ResourceService,
        BusinessService,
        CustomerService,
        { provide: ORDERS_REPOSITORY, useValue: orderRepo },
        { provide: ORDER_ITEM_REPOSITORY, useValue: orderItemRepo },
        { provide: PRODUCT_REPOSITORY, useValue: productRepo },
        { provide: SERVICE_REPOSITORY, useValue: serviceRepo },
        { provide: BUSINESS_REPOSITORY, useValue: businessRepo },
        { provide: CUSTOMER_REPOSITORY, useValue: customerRepo },
        {
          provide: UserService,
          useValue: { findUserById: jest.fn(), saveUser: jest.fn() },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
  });

  const setupOwnership = () => {
    businessRepo.findOne.mockResolvedValue(
      createBusinessStub({ ownerId }) as any,
    );
  };

  describe('createOrder with real ResourceService', () => {
    it('PRODUCT item: calls findOneProduct and updateProductInventory via real ResourceService', async () => {
      setupOwnership();
      const product = createProductStub({ availableQuantity: 10 });
      productRepo.findOne
        .mockResolvedValueOnce(product as any) // validateOrderItemResources
        .mockResolvedValueOnce(product as any) // createOrderItem
        .mockResolvedValueOnce(product as any); // updateProductInventory

      productRepo.save.mockResolvedValue({
        ...product,
        availableQuantity: 8,
      } as any);

      const orderItem = createOrderItemStub({ subTotal: 100 });
      orderItemRepo.create.mockReturnValue(orderItem as any);
      orderItemRepo.save.mockResolvedValue(orderItem as any);

      const order = createOrderStub({ totalAmount: 100 });
      orderRepo.create.mockReturnValue(order as any);
      orderRepo.save.mockResolvedValue(order as any);

      await orderService.createOrder({
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

      // productRepo.save called to decrement inventory
      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ availableQuantity: 8 }),
      );
    });

    it('SERVICE item: calls findOneService but does NOT update inventory', async () => {
      setupOwnership();
      const svc = createServiceStub();
      serviceRepo.findOne
        .mockResolvedValueOnce(svc as any) // validateOrderItemResources
        .mockResolvedValueOnce(svc as any); // createOrderItem

      const orderItem = createOrderItemStub({
        itemType: ItemType.SERVICE,
        subTotal: 60,
      });
      orderItemRepo.create.mockReturnValue(orderItem as any);
      orderItemRepo.save.mockResolvedValue(orderItem as any);

      const order = createOrderStub({ totalAmount: 60 });
      orderRepo.create.mockReturnValue(order as any);
      orderRepo.save.mockResolvedValue(order as any);

      await orderService.createOrder({
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

      // productRepo.save should NOT have been called for inventory
      expect(productRepo.save).not.toHaveBeenCalled();
    });

    it('propagates NotFoundException from ResourceService when product not found', async () => {
      setupOwnership();
      productRepo.findOne.mockResolvedValue(null); // product not found

      await expect(
        orderService.createOrder({
          businessId,
          ownerId,
          items: [
            {
              itemType: ItemType.PRODUCT,
              productId: 'bad-product',
              name: 'Ghost Product',
              price: 10,
              quantity: 1,
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
