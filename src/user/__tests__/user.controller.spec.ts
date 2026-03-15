import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { createUserStub } from 'src/common/__tests__/test-factories';

describe('UserController', () => {
  let controller: UserController;
  let mockService: jest.Mocked<Partial<UserService>>;

  const userId = 'user-uuid';

  beforeEach(async () => {
    mockService = {
      findUserById: jest.fn(),
      updateUserProfile: jest.fn(),
      updatePassword: jest.fn(),
      resetPassword: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  describe('getUserById', () => {
    it('returns user when jwtId matches userId', async () => {
      const user = createUserStub();
      mockService.findUserById!.mockResolvedValue(user as any);

      const mockReq = { user: { userId } } as any;
      const result = await controller.getUserById(userId, mockReq);

      expect(mockService.findUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('throws BadRequestException when jwtId does not match userId', async () => {
      const mockReq = { user: { userId: 'different-user' } } as any;

      await expect(controller.getUserById(userId, mockReq)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateUserProfile', () => {
    it('calls userService.updateUserProfile with correct params', async () => {
      const user = createUserStub({ firstName: 'Updated' });
      mockService.updateUserProfile!.mockResolvedValue(user as any);

      const dto = { firstName: 'Updated', lastName: 'Name' } as any;
      const result = await controller.updateUserProfile(userId, dto);

      expect(mockService.updateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Updated', userId }),
      );
      expect(result).toEqual(user);
    });

    it('throws BadRequestException when firstName is missing', async () => {
      await expect(
        controller.updateUserProfile(userId, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('calls userService.updatePassword with correct params', async () => {
      const user = createUserStub();
      mockService.updatePassword!.mockResolvedValue(user as any);

      const dto = {
        oldPassword: 'oldPass123!',
        newPassword: 'newPass456!',
      } as any;
      await controller.changePassword(userId, dto);

      expect(mockService.updatePassword).toHaveBeenCalledWith(
        'oldPass123!',
        'newPass456!',
        userId,
      );
    });

    it('throws BadRequestException when oldPassword or newPassword is missing', async () => {
      await expect(
        controller.changePassword(userId, { oldPassword: 'x' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('calls userService.resetPassword', async () => {
      const user = createUserStub();
      mockService.resetPassword!.mockResolvedValue(user as any);

      await controller.resetPassword(userId, {
        newPassword: 'newPass123!',
      } as any);

      expect(mockService.resetPassword).toHaveBeenCalledWith(
        'newPass123!',
        userId,
      );
    });

    it('throws BadRequestException when newPassword is missing', async () => {
      await expect(controller.resetPassword(userId, {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteUser', () => {
    it('calls userService.deleteUser', async () => {
      const user = createUserStub();
      mockService.deleteUser!.mockResolvedValue(user as any);

      await controller.deleteUser(userId);

      expect(mockService.deleteUser).toHaveBeenCalledWith(userId);
    });
  });
});
