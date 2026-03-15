import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { BusinessService } from '../business.service';
import { UserService } from 'src/user/user.service';
import { BUSINESS_REPOSITORY } from 'src/constants';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createBusinessStub,
  createUserStub,
} from 'src/common/__tests__/test-factories';

describe('BusinessService', () => {
  let service: BusinessService;
  let businessRepo: MockRepository;
  let mockUserService: jest.Mocked<Partial<UserService>>;

  const businessId = 'business-uuid';
  const ownerId = 'user-uuid';

  beforeEach(async () => {
    businessRepo = createMockRepository();
    mockUserService = {
      findUserById: jest.fn(),
      saveUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: BUSINESS_REPOSITORY, useValue: businessRepo },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
  });

  describe('findOne', () => {
    it('returns business when found', async () => {
      const business = createBusinessStub();
      businessRepo.findOne.mockResolvedValue(business as any);

      const result = await service.findOne({ businessId });

      expect(result).toEqual(business);
    });

    it('throws NotFoundException when business not found', async () => {
      businessRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne({ businessId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOwnerId', () => {
    it('returns business when found', async () => {
      const business = createBusinessStub();
      businessRepo.findOne.mockResolvedValue(business as any);

      const result = await service.findByOwnerId({ ownerId });

      expect(result).toEqual(business);
    });

    it('throws UnauthorizedException when no business found for owner', async () => {
      businessRepo.findOne.mockResolvedValue(null);

      await expect(service.findByOwnerId({ ownerId })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('create', () => {
    it('creates new business and updates user.businessId', async () => {
      businessRepo.findOne
        .mockResolvedValueOnce(null) // no existing business
        .mockResolvedValueOnce(createBusinessStub() as any); // findOne after save

      const user = createUserStub();
      mockUserService.findUserById!.mockResolvedValue(user as any);
      mockUserService.saveUser!.mockResolvedValue(user as any);
      const business = createBusinessStub();
      businessRepo.create.mockReturnValue(business as any);
      businessRepo.save.mockResolvedValue(business as any);

      const dto = {
        ownerId,
        name: 'Test Business',
        email: 'biz@example.com',
      } as any;

      await service.create(dto);

      expect(mockUserService.findUserById).toHaveBeenCalledWith(ownerId);
      expect(mockUserService.saveUser).toHaveBeenCalled();
    });

    it('calls update when business already exists for owner (upsert)', async () => {
      const existingBusiness = createBusinessStub({ id: 'existing-uuid' });
      businessRepo.findOne
        .mockResolvedValueOnce(existingBusiness as any) // existing found
        .mockResolvedValueOnce(existingBusiness as any); // after update

      businessRepo.update.mockResolvedValue({ affected: 1 } as any);

      const dto = {
        ownerId,
        name: 'Updated Business',
        email: 'biz@example.com',
      } as any;

      await service.create(dto);

      expect(businessRepo.update).toHaveBeenCalledWith('existing-uuid', dto);
      expect(mockUserService.findUserById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user not found', async () => {
      businessRepo.findOne.mockResolvedValueOnce(null);
      mockUserService.findUserById!.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        service.create({
          ownerId,
          name: 'Test',
          email: 'biz@example.com',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('calls repo.update and returns updated business', async () => {
      const business = createBusinessStub({ name: 'Updated' });
      businessRepo.update.mockResolvedValue({ affected: 1 } as any);
      businessRepo.findOne.mockResolvedValue(business as any);

      const result = await service.update(businessId, {
        name: 'Updated',
      } as any);

      expect(businessRepo.update).toHaveBeenCalledWith(businessId, {
        name: 'Updated',
      });
      expect(result).toEqual(business);
    });
  });

  describe('findAll', () => {
    it('returns list of businesses', async () => {
      const businesses = [createBusinessStub()];
      businessRepo.find.mockResolvedValue(businesses as any);

      const result = await service.findAll();

      expect(result).toEqual(businesses);
    });
  });
});
