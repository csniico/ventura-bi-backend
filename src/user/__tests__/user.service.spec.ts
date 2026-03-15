import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from '../user.service';
import { USER_REPOSITORY } from 'src/constants';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import { createUserStub } from 'src/common/__tests__/test-factories';

// Mock argon2 to avoid real CPU-intensive hashing in tests
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$hashed'),
  verify: jest.fn().mockResolvedValue(true),
}));

import * as argon2 from 'argon2';

describe('UserService', () => {
  let service: UserService;
  let userRepo: MockRepository;
  let mockEventEmitter: { emit: jest.Mock };

  const userId = 'user-uuid';

  beforeEach(async () => {
    userRepo = createMockRepository();
    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    it('returns user when found', async () => {
      const user = createUserStub();
      userRepo.findOne.mockResolvedValue(user as any);

      const result = await service.findUserById(userId);

      expect(result).toEqual(user);
      expect(userRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: userId } }),
      );
    });

    it('throws UnauthorizedException when userId is empty', async () => {
      await expect(service.findUserById('')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findUserById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    it('creates new local user and emits user.created event', async () => {
      userRepo.findOne.mockResolvedValue(null); // no existing user
      const newUser = createUserStub();
      userRepo.create.mockReturnValue(newUser as any);
      userRepo.save.mockResolvedValue(newUser as any);
      (argon2.hash as jest.Mock).mockResolvedValue('$argon2id$hashed');

      const result = await service.createUser({
        dto: {
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
          password: 'securePassword123',
        } as any,
        isGoogleUser: false,
      });

      expect(result.status).toBe('NEW_USER');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'user.created',
        expect.objectContaining({ email: newUser.email }),
      );
    });

    it('returns EXISTING_USER when non-Google user already exists', async () => {
      const existingUser = createUserStub();
      userRepo.findOne.mockResolvedValue(existingUser as any);

      const result = await service.createUser({
        dto: { email: existingUser.email } as any,
        isGoogleUser: false,
      });

      expect(result.status).toBe('EXISTING_USER');
      expect(result.user).toEqual(existingUser);
    });

    it('returns EXISTING_GOOGLE_USER when Google user already exists with same googleId', async () => {
      const existingUser = createUserStub({ googleId: 'google-id-123' });
      userRepo.findOne.mockResolvedValue(existingUser as any);

      const result = await service.createUser({
        dto: { email: existingUser.email, googleId: 'google-id-123' } as any,
        isGoogleUser: true,
      });

      expect(result.status).toBe('EXISTING_GOOGLE_USER');
    });

    it('throws UnauthorizedException when Google ID mismatches existing googleId', async () => {
      const existingUser = createUserStub({ googleId: 'google-id-123' });
      userRepo.findOne.mockResolvedValue(existingUser as any);

      await expect(
        service.createUser({
          dto: {
            email: existingUser.email,
            googleId: 'different-google-id',
          } as any,
          isGoogleUser: true,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('links Google account to existing local user when no googleId set', async () => {
      const existingUser = createUserStub({ googleId: null });
      userRepo.findOne.mockResolvedValue(existingUser as any);
      userRepo.save.mockResolvedValue({
        ...existingUser,
        googleId: 'new-google-id',
        isEmailVerified: true,
      } as any);

      const result = await service.createUser({
        dto: {
          email: existingUser.email,
          googleId: 'new-google-id',
        } as any,
        isGoogleUser: true,
      });

      expect(userRepo.save).toHaveBeenCalled();
      expect(result.status).toBe('EXISTING_GOOGLE_USER');
    });
  });

  describe('handleUserSignIn', () => {
    it('returns user without password on valid credentials', async () => {
      const user = createUserStub({ password: '$argon2id$hashed' });
      userRepo._mockQueryBuilder.getOne.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.handleUserSignIn({
        email: 'test@example.com',
        password: 'correctPassword',
      });

      expect(result).not.toHaveProperty('password');
    });

    it('throws BadRequestException when password is not provided', async () => {
      await expect(
        service.handleUserSignIn({ email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('does timing-safe dummy compare and throws UnauthorizedException when user not found', async () => {
      userRepo._mockQueryBuilder.getOne.mockResolvedValue(null);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.handleUserSignIn({
          email: 'nobody@example.com',
          password: 'any',
        }),
      ).rejects.toThrow(UnauthorizedException);

      // argon2.verify was still called (timing attack mitigation)
      expect(argon2.verify).toHaveBeenCalled();
    });

    it('throws UnauthorizedException on wrong password', async () => {
      const user = createUserStub({ password: '$argon2id$hashed' });
      userRepo._mockQueryBuilder.getOne.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.handleUserSignIn({
          email: 'test@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updatePassword', () => {
    it('saves new hashed password and emits auth.password.change when old password matches', async () => {
      const user = createUserStub({ password: '$argon2id$hashed' });
      userRepo._mockQueryBuilder.getOne.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('$argon2id$newhash');
      userRepo.save.mockResolvedValue(user as any);

      const result = await service.updatePassword(
        'oldPassword',
        'newPassword123!',
        userId,
      );

      expect(userRepo.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'auth.password.change',
        expect.objectContaining({ userId }),
      );
      expect(result).toBeDefined();
    });

    it('returns BadRequestException when old password does not match', async () => {
      const user = createUserStub({ password: '$argon2id$hashed' });
      userRepo._mockQueryBuilder.getOne.mockResolvedValue(user as any);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await service.updatePassword(
        'wrongOldPassword',
        'newPassword123!',
        userId,
      );

      // Returns exception (doesn't throw) per service implementation
      expect(result).toBeInstanceOf(BadRequestException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('removes user and emits user.deleted event', async () => {
      const user = createUserStub();
      userRepo.findOne.mockResolvedValue(user as any);
      userRepo.remove.mockResolvedValue(user as any);

      await service.deleteUser(userId);

      expect(userRepo.remove).toHaveBeenCalledWith(user);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'user.deleted',
        expect.objectContaining({ userId }),
      );
    });

    it('throws BadRequestException when userId is empty', async () => {
      await expect(service.deleteUser('')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserProfile', () => {
    it('saves and emits user.updated on valid update', async () => {
      const user = createUserStub();
      userRepo.findOne.mockResolvedValue(user as any);
      userRepo.save.mockResolvedValue(user as any);

      const result = await service.updateUserProfile({
        firstName: 'Updated',
        userId,
        lastName: 'Name',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(userRepo.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'user.updated',
        expect.objectContaining({ userId }),
      );
      expect(result).toBeDefined();
    });

    it('returns BadRequestException when firstName is empty', async () => {
      const result = await service.updateUserProfile({
        firstName: '',
        userId,
      });

      expect(result).toBeInstanceOf(BadRequestException);
    });
  });
});
