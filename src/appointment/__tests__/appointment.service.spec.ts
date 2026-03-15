import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppointmentService } from '../appointment.service';
import { UserService } from 'src/user/user.service';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { APPOINTMENT_REPOSITORY } from 'src/constants';
import { AppointmentStatus } from '../entities/appointment.entity';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import {
  createAppointmentStub,
  createBusinessStub,
  createCustomerStub,
  createUserStub,
} from 'src/common/__tests__/test-factories';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepo: MockRepository;
  let mockUserService: jest.Mocked<Partial<UserService>>;
  let mockBusinessService: jest.Mocked<Partial<BusinessService>>;
  let mockCustomerService: jest.Mocked<Partial<CustomerService>>;

  const userId = 'user-uuid';
  const businessId = 'business-uuid';
  const appointmentId = 'appointment-uuid';
  const customerId = 'customer-uuid';

  beforeEach(async () => {
    appointmentRepo = createMockRepository();
    mockUserService = { findUserById: jest.fn() };
    mockBusinessService = { findOne: jest.fn() };
    mockCustomerService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: APPOINTMENT_REPOSITORY, useValue: appointmentRepo },
        { provide: UserService, useValue: mockUserService },
        { provide: BusinessService, useValue: mockBusinessService },
        { provide: CustomerService, useValue: mockCustomerService },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  const setupAuthorizationOk = () => {
    const user = createUserStub({ businessId });
    const business = createBusinessStub({ id: businessId, ownerId: userId });
    mockUserService.findUserById!.mockResolvedValue(user as any);
    mockBusinessService.findOne!.mockResolvedValue(business as any);
  };

  describe('create', () => {
    it('throws UnauthorizedException when user does not own business', async () => {
      const user = createUserStub({ businessId: 'other-business' });
      const business = createBusinessStub({ id: businessId, ownerId: userId });
      mockUserService.findUserById!.mockResolvedValue(user as any);
      mockBusinessService.findOne!.mockResolvedValue(business as any);

      await expect(
        service.create({
          userId,
          businessId,
          title: 'Test',
          startTime: '2024-06-01T09:00:00Z',
          endTime: '2024-06-01T10:00:00Z',
          isRecurring: false,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws NotFoundException when user not found', async () => {
      mockUserService.findUserById!.mockRejectedValue(new NotFoundException());
      mockBusinessService.findOne!.mockResolvedValue(
        createBusinessStub({ id: businessId, ownerId: userId }) as any,
      );

      await expect(
        service.create({
          userId,
          businessId,
          title: 'Test',
          startTime: '2024-06-01T09:00:00Z',
          endTime: '2024-06-01T10:00:00Z',
          isRecurring: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when isRecurring=true but recurringFrequency missing', async () => {
      setupAuthorizationOk();

      await expect(
        service.create({
          userId,
          businessId,
          title: 'Recurring Appointment',
          startTime: '2024-06-01T09:00:00Z',
          endTime: '2024-06-01T10:00:00Z',
          isRecurring: true,
          recurringFrequency: undefined,
          recurringUntil: undefined,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls customerService.findOne when customerId provided', async () => {
      setupAuthorizationOk();
      const customer = createCustomerStub();
      mockCustomerService.findOne!.mockResolvedValue(customer as any);

      const appointment = createAppointmentStub({ customerId });
      appointmentRepo.create.mockReturnValue(appointment as any);
      appointmentRepo.save.mockResolvedValue(appointment as any);

      await service.create({
        userId,
        businessId,
        title: 'Test',
        startTime: '2024-06-01T09:00:00Z',
        endTime: '2024-06-01T10:00:00Z',
        isRecurring: false,
        customerId,
      });

      expect(mockCustomerService.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ customerId }),
      );
    });

    it('creates appointment with SCHEDULED status', async () => {
      setupAuthorizationOk();
      const appointment = createAppointmentStub();
      appointmentRepo.create.mockReturnValue(appointment as any);
      appointmentRepo.save.mockResolvedValue(appointment as any);

      await service.create({
        userId,
        businessId,
        title: 'Test Appointment',
        startTime: '2024-06-01T09:00:00Z',
        endTime: '2024-06-01T10:00:00Z',
        isRecurring: false,
      });

      expect(appointmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.SCHEDULED }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when appointment does not exist', async () => {
      setupAuthorizationOk();
      appointmentRepo.exists.mockResolvedValue(false);

      await expect(
        service.update({
          appointmentId,
          businessId,
          ownerId: userId,
          title: 'Updated',
          startTime: '2024-06-01T09:00:00Z',
          endTime: '2024-06-01T10:00:00Z',
          isRecurring: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets customerId to NULL via query builder when customerId is undefined', async () => {
      setupAuthorizationOk();
      appointmentRepo.exists.mockResolvedValue(true);
      appointmentRepo.update.mockResolvedValue({ affected: 1 } as any);

      const appointment = createAppointmentStub({ customerId: null });
      appointmentRepo.findOne.mockResolvedValue(appointment as any);

      await service.update({
        appointmentId,
        businessId,
        ownerId: userId,
        title: 'Updated',
        startTime: '2024-06-01T09:00:00Z',
        endTime: '2024-06-01T10:00:00Z',
        isRecurring: false,
        customerId: undefined,
      });

      // Query builder should have been used for NULL set
      expect(appointmentRepo._mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('updates customerId when customerId is provided', async () => {
      setupAuthorizationOk();
      appointmentRepo.exists.mockResolvedValue(true);
      appointmentRepo.update.mockResolvedValue({ affected: 1 } as any);

      const customer = createCustomerStub();
      mockCustomerService.findOne!.mockResolvedValue(customer as any);

      const appointment = createAppointmentStub({ customerId });
      appointmentRepo.findOne.mockResolvedValue(appointment as any);

      await service.update({
        appointmentId,
        businessId,
        ownerId: userId,
        title: 'Updated',
        startTime: '2024-06-01T09:00:00Z',
        endTime: '2024-06-01T10:00:00Z',
        isRecurring: false,
        customerId,
      });

      expect(mockCustomerService.findOne).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when appointment not found', async () => {
      setupAuthorizationOk();
      appointmentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.delete({
          appointmentId,
          dto: { userId, businessId } as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes appointment when found', async () => {
      setupAuthorizationOk();
      const appointment = createAppointmentStub();
      appointmentRepo.findOne.mockResolvedValue(appointment as any);
      appointmentRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete({
        appointmentId,
        dto: { userId, businessId } as any,
      });

      expect(appointmentRepo.delete).toHaveBeenCalledWith(appointmentId);
      expect(result).toEqual({ message: 'Deleted successfully.' });
    });
  });

  describe('findByUserId', () => {
    it('returns reversed array of appointments', async () => {
      const a1 = createAppointmentStub({ id: 'appt-1' });
      const a2 = createAppointmentStub({ id: 'appt-2' });
      appointmentRepo.find.mockResolvedValue([a1, a2] as any);

      const result = await service.findByUserId(userId);

      // Result should be reversed
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0].id).toBe('appt-2');
        expect(result[1].id).toBe('appt-1');
      }
    });
  });

  describe('updateGoogleEventId', () => {
    it('stores "none" when googleEventId is empty string', async () => {
      setupAuthorizationOk();
      const appointment = createAppointmentStub();
      appointmentRepo.findOne.mockResolvedValue(appointment as any);
      appointmentRepo.save.mockResolvedValue({
        ...appointment,
        googleEventId: 'none',
      } as any);

      await service.updateGoogleEventId({
        appointmentId,
        dto: { userId, businessId, googleEventId: '' } as any,
      });

      expect(appointmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ googleEventId: 'none' }),
      );
    });

    it('stores the actual googleEventId when provided', async () => {
      setupAuthorizationOk();
      const appointment = createAppointmentStub();
      appointmentRepo.findOne.mockResolvedValue(appointment as any);
      appointmentRepo.save.mockResolvedValue({
        ...appointment,
        googleEventId: 'google-event-123',
      } as any);

      await service.updateGoogleEventId({
        appointmentId,
        dto: { userId, businessId, googleEventId: 'google-event-123' } as any,
      });

      expect(appointmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ googleEventId: 'google-event-123' }),
      );
    });
  });
});
