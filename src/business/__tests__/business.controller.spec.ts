import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { BusinessController } from '../business.controller';
import { BusinessService } from '../business.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { createBusinessStub } from 'src/common/__tests__/test-factories';

describe('BusinessController', () => {
  let controller: BusinessController;
  let mockService: jest.Mocked<Partial<BusinessService>>;

  const mockReq = { user: { userId: 'user-uuid' } };

  beforeEach(async () => {
    mockService = {
      findByOwnerId: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [{ provide: BusinessService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BusinessController>(BusinessController);
  });

  describe('findBusiness', () => {
    it('calls findByOwnerId with userId from token when search=owner', async () => {
      const business = createBusinessStub();
      mockService.findByOwnerId!.mockResolvedValue(business as any);

      const result = await controller.findBusiness(mockReq, {
        search: 'owner',
      } as any);

      expect(mockService.findByOwnerId).toHaveBeenCalledWith({
        ownerId: 'user-uuid',
      });
      expect(result).toEqual(business);
    });

    it('calls findOne with businessId when search=business', async () => {
      const business = createBusinessStub();
      mockService.findOne!.mockResolvedValue(business as any);

      const result = await controller.findBusiness(mockReq, {
        search: 'business',
        businessId: 'business-uuid',
      } as any);

      expect(mockService.findOne).toHaveBeenCalledWith({
        businessId: 'business-uuid',
      });
      expect(result).toEqual(business);
    });

    it('throws UnauthorizedException when userId missing from request', async () => {
      await expect(
        controller.findBusiness(
          { user: {} } as any,
          { search: 'owner' } as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('create', () => {
    it('calls businessService.create with dto', async () => {
      const business = createBusinessStub();
      mockService.create!.mockResolvedValue(business as any);

      const dto = { name: 'Test Business', ownerId: 'user-uuid' } as any;
      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(business);
    });
  });

  describe('update', () => {
    it('calls businessService.update with id and dto', async () => {
      const business = createBusinessStub({ name: 'Updated' });
      mockService.update!.mockResolvedValue(business as any);

      const result = await controller.update('business-uuid', {
        name: 'Updated',
      } as any);

      expect(mockService.update).toHaveBeenCalledWith('business-uuid', {
        name: 'Updated',
      });
      expect(result).toEqual(business);
    });
  });
});
