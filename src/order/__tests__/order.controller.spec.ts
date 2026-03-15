import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { OrderStatus } from '../entities/order.entity';
import { createOrderStub } from 'src/common/__tests__/test-factories';

describe('OrderController', () => {
  let controller: OrderController;
  let mockService: jest.Mocked<Partial<OrderService>>;

  const mockReq = { user: { userId: 'user-uuid' } };

  beforeEach(async () => {
    mockService = {
      createOrder: jest.fn(),
      searchOrders: jest.fn(),
      getOrderStats: jest.fn(),
      getCustomerOrders: jest.fn(),
      getOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrderController>(OrderController);
  });

  describe('createOrder', () => {
    it('calls orderService.createOrder with ownerId from request', async () => {
      const order = createOrderStub();
      mockService.createOrder!.mockResolvedValue(order as any);

      const dto = {
        businessId: 'business-uuid',
        items: [],
      } as any;

      await controller.createOrder(mockReq, dto);

      expect(mockService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-uuid',
          businessId: 'business-uuid',
        }),
      );
    });

    it('throws UnauthorizedException when userId missing', async () => {
      await expect(
        controller.createOrder({ user: {} } as any, {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('searchOrders', () => {
    it('builds searchFilters when filters=on', async () => {
      mockService.searchOrders!.mockResolvedValue({
        data: [],
        meta: {},
      } as any);

      await controller.searchOrders(mockReq, {
        businessId: 'business-uuid',
        q: 'test',
        filters: 'on',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        minTotal: 10,
        maxTotal: 100,
        page: 1,
        limit: 10,
      } as any);

      expect(mockService.searchOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          searchFilters: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            minTotal: 10,
            maxTotal: 100,
          },
        }),
      );
    });

    it('passes searchFilters as undefined when filters is not "on"', async () => {
      mockService.searchOrders!.mockResolvedValue({
        data: [],
        meta: {},
      } as any);

      await controller.searchOrders(mockReq, {
        businessId: 'business-uuid',
        q: 'test',
        filters: 'off',
        page: 1,
        limit: 10,
      } as any);

      expect(mockService.searchOrders).toHaveBeenCalledWith(
        expect.objectContaining({ searchFilters: undefined }),
      );
    });
  });

  describe('getOrderStats', () => {
    it('calls orderService.getOrderStats', async () => {
      mockService.getOrderStats!.mockResolvedValue({} as any);

      await controller.getOrderStats(mockReq, {
        businessId: 'business-uuid',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      } as any);

      expect(mockService.getOrderStats).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'business-uuid',
          ownerId: 'user-uuid',
        }),
      );
    });
  });

  describe('getCustomerOrders', () => {
    it('calls getCustomerOrders with customerId from path param', async () => {
      mockService.getCustomerOrders!.mockResolvedValue({
        data: [],
        meta: {},
      } as any);

      await controller.getCustomerOrders(mockReq, 'customer-uuid', {
        businessId: 'business-uuid',
        page: 1,
        limit: 10,
      } as any);

      expect(mockService.getCustomerOrders).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'customer-uuid' }),
      );
    });
  });

  describe('getOrders', () => {
    it('calls orderService.getOrders with optional filters', async () => {
      mockService.getOrders!.mockResolvedValue({ data: [], meta: {} } as any);

      await controller.getOrders(mockReq, {
        businessId: 'business-uuid',
        status: OrderStatus.PENDING,
        page: 1,
        limit: 10,
      } as any);

      expect(mockService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PENDING,
          ownerId: 'user-uuid',
        }),
      );
    });
  });

  describe('getOrderById', () => {
    it('calls orderService.getOrderById', async () => {
      const order = createOrderStub();
      mockService.getOrderById!.mockResolvedValue(order as any);

      const result = await controller.getOrderById(
        mockReq,
        'order-uuid',
        'business-uuid',
      );

      expect(mockService.getOrderById).toHaveBeenCalledWith({
        orderId: 'order-uuid',
        businessId: 'business-uuid',
        ownerId: 'user-uuid',
      });
      expect(result).toEqual(order);
    });
  });

  describe('updateOrderStatus', () => {
    it('calls orderService.updateOrderStatus', async () => {
      const order = createOrderStub({ status: OrderStatus.COMPLETED });
      mockService.updateOrderStatus!.mockResolvedValue(order as any);

      await controller.updateOrderStatus(
        mockReq,
        'order-uuid',
        'business-uuid',
        {
          status: OrderStatus.COMPLETED,
        } as any,
      );

      expect(mockService.updateOrderStatus).toHaveBeenCalledWith({
        orderId: 'order-uuid',
        businessId: 'business-uuid',
        ownerId: 'user-uuid',
        status: OrderStatus.COMPLETED,
      });
    });
  });
});
