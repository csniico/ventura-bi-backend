import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ResourceService } from '../resource.service';
import { BusinessService } from 'src/business/business.service';
import { PRODUCT_REPOSITORY, SERVICE_REPOSITORY } from 'src/constants';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createBusinessStub,
  createProductStub,
  createServiceStub,
} from 'src/common/__tests__/test-factories';

describe('ResourceService', () => {
  let service: ResourceService;
  let productRepo: MockRepository;
  let serviceRepo: MockRepository;
  let mockBusinessService: jest.Mocked<Partial<BusinessService>>;

  const ownerId = 'user-uuid';
  const businessId = 'business-uuid';
  const productId = 'product-uuid';
  const serviceId = 'service-uuid';

  beforeEach(async () => {
    productRepo = createMockRepository();
    serviceRepo = createMockRepository();
    mockBusinessService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        { provide: PRODUCT_REPOSITORY, useValue: productRepo },
        { provide: SERVICE_REPOSITORY, useValue: serviceRepo },
        { provide: BusinessService, useValue: mockBusinessService },
      ],
    }).compile();

    service = module.get<ResourceService>(ResourceService);
  });

  const setupOwnershipOk = () => {
    mockBusinessService.findOne!.mockResolvedValue(
      createBusinessStub({ ownerId }) as any,
    );
  };

  describe('createProduct', () => {
    it('verifies ownership, creates and saves product', async () => {
      setupOwnershipOk();
      const product = createProductStub();
      productRepo.create.mockReturnValue(product as any);
      productRepo.save.mockResolvedValue(product as any);

      const result = await service.createProduct({
        ownerId,
        businessId,
        name: 'Test Product',
        price: 50,
        availableQuantity: 10,
        primaryImage: null,
        supportingImages: [],
        description: null,
        notes: null,
      });

      expect(productRepo.create).toHaveBeenCalled();
      expect(productRepo.save).toHaveBeenCalled();
      expect(result).toEqual(product);
    });
  });

  describe('createService', () => {
    it('verifies ownership, creates and saves service', async () => {
      setupOwnershipOk();
      const svc = createServiceStub();
      serviceRepo.create.mockReturnValue(svc as any);
      serviceRepo.save.mockResolvedValue(svc as any);

      const result = await service.createService({
        ownerId,
        businessId,
        name: 'Test Service',
        price: 30,
        primaryImage: null,
        supportingImages: [],
        description: null,
        notes: null,
        businessHours: null,
      });

      expect(serviceRepo.create).toHaveBeenCalled();
      expect(result).toEqual(svc);
    });
  });

  describe('findOneProduct', () => {
    it('returns product when found', async () => {
      setupOwnershipOk();
      const product = createProductStub();
      productRepo.findOne.mockResolvedValue(product as any);

      const result = await service.findOneProduct({
        ownerId,
        businessId,
        productId,
      });

      expect(result).toEqual(product);
    });

    it('throws NotFoundException when product not found', async () => {
      setupOwnershipOk();
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneProduct({ ownerId, businessId, productId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneService', () => {
    it('returns service when found', async () => {
      setupOwnershipOk();
      const svc = createServiceStub();
      serviceRepo.findOne.mockResolvedValue(svc as any);

      const result = await service.findOneService({
        ownerId,
        businessId,
        serviceId,
      });

      expect(result).toEqual(svc);
    });

    it('throws NotFoundException when service not found', async () => {
      setupOwnershipOk();
      serviceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneService({ ownerId, businessId, serviceId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProduct', () => {
    it('removes product when found', async () => {
      setupOwnershipOk();
      const product = createProductStub();
      productRepo.findOne.mockResolvedValue(product as any);
      productRepo.remove.mockResolvedValue(product as any);

      const result = await service.deleteProduct({
        ownerId,
        businessId,
        productId,
      });

      expect(productRepo.remove).toHaveBeenCalledWith(product);
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });

    it('throws UnauthorizedException when product not found (info leakage mitigation)', async () => {
      setupOwnershipOk();
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteProduct({ ownerId, businessId, productId }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteService', () => {
    it('throws UnauthorizedException when service not found', async () => {
      setupOwnershipOk();
      serviceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteService({ ownerId, businessId, serviceId }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProductInventory', () => {
    it('decrements quantity and saves', async () => {
      setupOwnershipOk();
      const product = createProductStub({ availableQuantity: 10 });
      productRepo.findOne.mockResolvedValue(product as any);
      productRepo.save.mockResolvedValue({
        ...product,
        availableQuantity: 8,
      } as any);

      await service.updateProductInventory({
        ownerId,
        businessId,
        productId,
        quantityChange: -2,
      });

      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ availableQuantity: 8 }),
      );
    });

    it('clamps to 0 when decrement would produce negative quantity', async () => {
      setupOwnershipOk();
      const product = createProductStub({ availableQuantity: 1 });
      productRepo.findOne.mockResolvedValue(product as any);
      productRepo.save.mockResolvedValue({
        ...product,
        availableQuantity: 0,
      } as any);

      await service.updateProductInventory({
        ownerId,
        businessId,
        productId,
        quantityChange: -5,
      });

      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ availableQuantity: 0 }),
      );
    });

    it('throws NotFoundException when product not found', async () => {
      setupOwnershipOk();
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProductInventory({
          ownerId,
          businessId,
          productId,
          quantityChange: -1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProduct', () => {
    it('applies partial update with null-safe field assignment', async () => {
      setupOwnershipOk();
      const product = createProductStub({ name: 'Old Name', price: 50 });
      productRepo.findOne.mockResolvedValue(product as any);
      productRepo.save.mockResolvedValue({
        ...product,
        name: 'New Name',
      } as any);

      await service.updateProduct({
        ownerId,
        businessId,
        productId,
        name: 'New Name',
        price: undefined, // should keep original price
      });

      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          price: 50, // retained
        }),
      );
    });
  });

  describe('searchProductsAndServices', () => {
    it('skips ILIKE filter when searchQuery is empty', async () => {
      setupOwnershipOk();
      productRepo._mockQueryBuilder.getMany.mockResolvedValue([]);
      serviceRepo._mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.searchProductsAndServices({
        ownerId,
        businessId,
        searchQuery: '',
      });

      const productQBWhere = productRepo._mockQueryBuilder.andWhere;
      // andWhere should NOT have been called with ILIKE
      const ilikeCalls = productQBWhere.mock.calls.filter(([q]: [string]) =>
        q?.toString().includes('ILIKE'),
      );
      expect(ilikeCalls).toHaveLength(0);
    });

    it('applies price filters to query when provided', async () => {
      setupOwnershipOk();
      productRepo._mockQueryBuilder.getMany.mockResolvedValue([]);
      serviceRepo._mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.searchProductsAndServices({
        ownerId,
        businessId,
        searchQuery: 'test',
        searchFilters: { minPrice: 10, maxPrice: 100 },
      });

      const andWhereCalls = productRepo._mockQueryBuilder.andWhere.mock.calls;
      const minPriceCall = andWhereCalls.find(([q]: [string]) =>
        q?.toString().includes('minPrice'),
      );
      expect(minPriceCall).toBeDefined();
    });
  });

  describe('findManyProducts', () => {
    it('calls findBy with In(productIds) and businessId', async () => {
      setupOwnershipOk();
      const products = [createProductStub()];
      productRepo.findBy.mockResolvedValue(products as any);

      const result = await service.findManyProducts({
        ownerId,
        businessId,
        productIds: ['product-uuid'],
      });

      expect(productRepo.findBy).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });
});
