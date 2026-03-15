import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AppointmentController } from '../appointment.controller';
import { AppointmentService } from '../appointment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { createAppointmentStub } from 'src/common/__tests__/test-factories';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let mockService: jest.Mocked<Partial<AppointmentService>>;

  const mockReq = { user: { userId: 'user-uuid' } };

  beforeEach(async () => {
    mockService = {
      findByUserId: jest.fn(),
      findByBusinessId: jest.fn(),
      create: jest.fn(),
      updateGoogleEventId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [{ provide: AppointmentService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppointmentController>(AppointmentController);
  });

  describe('findByUserId', () => {
    it('passes userId query param to appointmentService.findByUserId', async () => {
      const appointments = [createAppointmentStub()];
      mockService.findByUserId!.mockResolvedValue(appointments as any);

      const result = await controller.findByUserId('user-uuid');

      expect(mockService.findByUserId).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(appointments);
    });
  });

  describe('findByBusinessId', () => {
    it('passes businessId query param to appointmentService.findByBusinessId', async () => {
      const appointments = [createAppointmentStub()];
      mockService.findByBusinessId!.mockResolvedValue(appointments as any);

      const result = await controller.findByBusinessId('business-uuid');

      expect(mockService.findByBusinessId).toHaveBeenCalledWith(
        'business-uuid',
      );
      expect(result).toEqual(appointments);
    });
  });

  describe('createAppointment', () => {
    it('extracts ownerId from request and calls appointmentService.create', async () => {
      const appointment = createAppointmentStub();
      mockService.create!.mockResolvedValue(appointment as any);

      const dto = {
        businessId: 'business-uuid',
        title: 'Test Appointment',
        startTime: '2024-06-01T09:00:00Z',
        endTime: '2024-06-01T10:00:00Z',
        isRecurring: false,
      } as any;

      await controller.createAppointment(mockReq, dto);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid',
          businessId: 'business-uuid',
          title: 'Test Appointment',
        }),
      );
    });

    it('throws UnauthorizedException when userId missing from request', async () => {
      await expect(
        controller.createAppointment({ user: {} } as any, {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateGoogleEventId', () => {
    it('calls appointmentService.updateGoogleEventId', async () => {
      const appointment = createAppointmentStub({ googleEventId: 'event-123' });
      mockService.updateGoogleEventId!.mockResolvedValue(appointment as any);

      const dto = {
        userId: 'user-uuid',
        businessId: 'business-uuid',
        googleEventId: 'event-123',
      } as any;

      await controller.updateGoogleEventId('appointment-uuid', dto);

      expect(mockService.updateGoogleEventId).toHaveBeenCalledWith({
        dto,
        appointmentId: 'appointment-uuid',
      });
    });
  });

  describe('updateAppointment', () => {
    it('extracts ownerId from request and calls appointmentService.update', async () => {
      const appointment = createAppointmentStub({ title: 'Updated' });
      mockService.update!.mockResolvedValue(appointment as any);

      const dto = {
        businessId: 'business-uuid',
        title: 'Updated',
        startTime: '2024-06-01T09:00:00Z',
        endTime: '2024-06-01T10:00:00Z',
        isRecurring: false,
      } as any;

      await controller.updateAppointment(mockReq, 'appointment-uuid', dto);

      expect(mockService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-uuid',
          appointmentId: 'appointment-uuid',
        }),
      );
    });
  });

  describe('deleteAppointment', () => {
    it('calls appointmentService.delete with appointmentId and dto', async () => {
      mockService.delete!.mockResolvedValue({
        message: 'Deleted successfully.',
      });

      const dto = {
        userId: 'user-uuid',
        businessId: 'business-uuid',
      } as any;

      await controller.deleteAppointment('appointment-uuid', dto);

      expect(mockService.delete).toHaveBeenCalledWith({
        appointmentId: 'appointment-uuid',
        dto,
      });
    });
  });
});
