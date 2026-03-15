import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ResourceController } from '../resource.controller';
import { ResourceService } from '../resource.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import {
  createProductStub,
  createServiceStub,
} from 'src/common/__tests__/test-factories';

describe('ResourceController', () => {
  let controller: ResourceController;
  let mockService: jest.Mocked<Partial<ResourceService>>;

  const mockReq = { user: { userId: 'user-uuid' } };

  beforeEach(async () => {
    mockService = {
      searchProductsAndServices: jest.fn(),
      findOneProduct: jest.fn(),
      findOneService: jest.fn(),
      createProduct: jest.fn(),
      createService: jest.fn(),
      updateProduct: jest.fn(),
      updateService: jest.fn(),
      deleteProduct: jest.fn(),
      deleteService: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourceController],
      providers: [{ provide: ResourceService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ResourceController>(ResourceController);
  });

  describe('searchResources', () => {
    it('builds searchFilters when filters=on', async () => {
      mockService.searchProductsAndServices!.mockResolvedValue({
        products: [],
        services: [],
      } as any);

      await controller.searchResources(mockReq, {
        businessId: 'business-uuid',
        q: 'laptop',
        filters: 'on',
        minPrice: 100,
        maxPrice: 1000,
        minQty: 5,
        page: 1,
        limit: 10,
      } as any);

      expect(mockService.searchProductsAndServices).toHaveBeenCalledWith(
        expect.objectContaining({
          searchFilters: {
            minPrice: 100,
            maxPrice: 1000,
            minAvailableQuantity: 5,
          },
        }),
      );
    });

    it('passes searchFilters as undefined when filters is not "on"', async () => {
      mockService.searchProductsAndServices!.mockResolvedValue({
        products: [],
        services: [],
      } as any);

      await controller.searchResources(mockReq, {
        businessId: 'business-uuid',
        q: 'laptop',
        filters: 'off',
      } as any);

      expect(mockService.searchProductsAndServices).toHaveBeenCalledWith(
        expect.objectContaining({ searchFilters: undefined }),
      );
    });
  });

  describe('findResources', () => {
    it('calls findOneProduct when type=product, filter=one', async () => {
      const product = createProductStub();
      mockService.findOneProduct!.mockResolvedValue(product as any);

      const result = await controller.findResources(mockReq, {
        type: 'product',
        filter: 'one',
        businessId: 'business-uuid',
        resourceId: 'product-uuid',
      } as any);

      expect(mockService.findOneProduct).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'product-uuid' }),
      );
      expect(result).toEqual(product);
    });

    it('calls findOneService when type=service, filter=one', async () => {
      const svc = createServiceStub();
      mockService.findOneService!.mockResolvedValue(svc as any);

      const result = await controller.findResources(mockReq, {
        type: 'service',
        filter: 'one',
        businessId: 'business-uuid',
        resourceId: 'service-uuid',
      } as any);

      expect(mockService.findOneService).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: 'service-uuid' }),
      );
      expect(result).toEqual(svc);
    });

    it('throws UnauthorizedException when filter=many for type=product (current impl)', async () => {
      await expect(
        controller.findResources(mockReq, {
          type: 'product',
          filter: 'many',
          businessId: 'business-uuid',
        } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createProduct', () => {
    it('calls resourceService.createProduct with ownerId from request', async () => {
      const product = createProductStub();
      mockService.createProduct!.mockResolvedValue(product as any);

      const dto = {
        businessId: 'business-uuid',
        name: 'New Product',
        price: 50,
        availableQuantity: 10,
      } as any;

      const result = await controller.createProduct(mockReq, dto);

      expect(mockService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-uuid', name: 'New Product' }),
      );
      expect(result).toEqual(product);
    });
  });

  describe('createService', () => {
    it('calls resourceService.createService', async () => {
      const svc = createServiceStub();
      mockService.createService!.mockResolvedValue(svc as any);

      const dto = {
        businessId: 'business-uuid',
        name: 'New Service',
        price: 30,
      } as any;

      await controller.createService(mockReq, dto);

      expect(mockService.createService).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-uuid', name: 'New Service' }),
      );
    });
  });

  describe('updateProduct', () => {
    it('calls resourceService.updateProduct with businessId from query param', async () => {
      const product = createProductStub({ name: 'Updated' });
      mockService.updateProduct!.mockResolvedValue(product as any);

      await controller.updateProduct(mockReq, 'product-uuid', 'business-uuid', {
        name: 'Updated',
      } as any);

      expect(mockService.updateProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-uuid',
          businessId: 'business-uuid',
          ownerId: 'user-uuid',
        }),
      );
    });
  });

  describe('updateService', () => {
    it('calls resourceService.updateService', async () => {
      const svc = createServiceStub({ name: 'Updated Service' });
      mockService.updateService!.mockResolvedValue(svc as any);

      await controller.updateService(mockReq, 'service-uuid', 'business-uuid', {
        name: 'Updated Service',
      } as any);

      expect(mockService.updateService).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: 'service-uuid',
          businessId: 'business-uuid',
        }),
      );
    });
  });

  describe('deleteProduct', () => {
    it('calls resourceService.deleteProduct', async () => {
      mockService.deleteProduct!.mockResolvedValue({
        message: 'Product deleted successfully',
      });

      await controller.deleteProduct(mockReq, 'product-uuid', 'business-uuid');

      expect(mockService.deleteProduct).toHaveBeenCalledWith({
        ownerId: 'user-uuid',
        businessId: 'business-uuid',
        productId: 'product-uuid',
      });
    });
  });

  describe('deleteService', () => {
    it('calls resourceService.deleteService', async () => {
      mockService.deleteService!.mockResolvedValue({
        message: 'Service deleted successfully',
      });

      await controller.deleteService(mockReq, 'service-uuid', 'business-uuid');

      expect(mockService.deleteService).toHaveBeenCalledWith({
        ownerId: 'user-uuid',
        businessId: 'business-uuid',
        serviceId: 'service-uuid',
      });
    });
  });
});
