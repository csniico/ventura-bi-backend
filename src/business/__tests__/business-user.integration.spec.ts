import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessService } from '../business.service';
import { UserService } from 'src/user/user.service';
import { BUSINESS_REPOSITORY, USER_REPOSITORY } from 'src/constants';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createBusinessStub,
  createUserStub,
} from 'src/common/__tests__/test-factories';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$hashed'),
  verify: jest.fn().mockResolvedValue(true),
}));

describe('Business + User Integration', () => {
  let businessService: BusinessService;
  let businessRepo: MockRepository;
  let userRepo: MockRepository;

  beforeEach(async () => {
    businessRepo = createMockRepository();
    userRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        UserService,
        { provide: BUSINESS_REPOSITORY, useValue: businessRepo },
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    businessService = module.get<BusinessService>(BusinessService);
  });

  describe('create — new business wires into real UserService', () => {
    it('calls real UserService.findUserById and updates user.businessId', async () => {
      const user = createUserStub({ businessId: null });
      const business = createBusinessStub();

      // First findOne: no existing business
      businessRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(business as any);
      userRepo.findOne.mockResolvedValue(user as any);
      userRepo.save.mockResolvedValue({
        ...user,
        businessId: business.id,
      } as any);
      businessRepo.create.mockReturnValue(business as any);
      businessRepo.save.mockResolvedValue(business as any);

      await businessService.create({
        ownerId: 'user-uuid',
        name: 'My Business',
        email: 'biz@example.com',
      } as any);

      expect(userRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid' } }),
      );
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: business.id }),
      );
    });

    it('upsert path does NOT call UserService.findUserById', async () => {
      const existingBusiness = createBusinessStub({ id: 'existing-uuid' });
      businessRepo.findOne
        .mockResolvedValueOnce(existingBusiness as any)
        .mockResolvedValueOnce(existingBusiness as any);
      businessRepo.update.mockResolvedValue({ affected: 1 } as any);

      await businessService.create({
        ownerId: 'user-uuid',
        name: 'My Business',
        email: 'biz@example.com',
      } as any);

      expect(userRepo.findOne).not.toHaveBeenCalled();
    });
  });
});
