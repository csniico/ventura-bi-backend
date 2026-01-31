import { Inject, Injectable, Logger } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import {
  IUpdateAppointmentCustomer,
  IUpdateAppointmentDescription,
  IUpdateAppointmentEndTime,
  IUpdateAppointmentNotes,
  IUpdateAppointmentRecurringDetails,
  IUpdateAppointmentStartTime,
  IUpdateAppointmentStatus,
  IUpdateAppointmentTitle,
} from './interfaces/update-appointment.interface';

@Injectable()
export class AppointmentUpdateService {
  private logger = new Logger(AppointmentUpdateService.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  private async appointmentExists(appointmentId: string): Promise<void> {
    const exists = await this.appointmentRepository.exists({
      where: { id: appointmentId },
    });
    if (!exists) {
      this.logger.warn(
        `Attempted to update title for non-existent appointment with id ${appointmentId}`,
      );
      throw new Error(`Appointment with id ${appointmentId} does not exist`);
    }
  }

  async updateAppointmentStatus(params: IUpdateAppointmentStatus) {
    const { appointmentId, newStatus } = params;
    await this.appointmentExists(appointmentId);
    return await this.appointmentRepository.update(appointmentId, {
      status: newStatus,
    });
  }

  async updateAppointmentTitle(params: IUpdateAppointmentTitle) {
    const { appointmentId, newTitle } = params;
    await this.appointmentExists(appointmentId);
    return await this.appointmentRepository.update(appointmentId, {
      title: newTitle,
    });
  }

  async updateAppointmentStartTime(params: IUpdateAppointmentStartTime) {
    const { appointmentId, newStartTime } = params;
    await this.appointmentExists(appointmentId);
    return await this.appointmentRepository.update(appointmentId, {
      startTime: new Date(newStartTime),
    });
  }

  async updateAppointmentEndTime(params: IUpdateAppointmentEndTime) {
    const { appointmentId, newEndTime } = params;
    await this.appointmentExists(appointmentId);
    return await this.appointmentRepository.update(appointmentId, {
      endTime: new Date(newEndTime),
    });
  }

  async updateAppointmentDescription(params: IUpdateAppointmentDescription) {
    const { appointmentId, newDescription } = params;
    await this.appointmentExists(appointmentId);
    return await this.appointmentRepository.update(appointmentId, {
      description: newDescription,
    });
  }

  async updateAppointmentNotes(params: IUpdateAppointmentNotes) {
    const { appointmentId, newNotes } = params;
    await this.appointmentExists(appointmentId);
    return await this.appointmentRepository.update(appointmentId, {
      notes: newNotes,
    });
  }

  async updateAppointmentCustomer(params: IUpdateAppointmentCustomer) {
    const { appointmentId, newCustomerId, newCustomer } = params;
    await this.appointmentExists(appointmentId);
    return await this.appointmentRepository.update(appointmentId, {
      customerId: newCustomerId,
      customer: newCustomer,
    });
  }

  async updateAppointmentRecurringDetails(
    params: IUpdateAppointmentRecurringDetails,
  ) {
    const { appointmentId, isRecurring, recurringFrequency, recurringUntil } =
      params;
    await this.appointmentExists(appointmentId);
    if (!isRecurring) {
      return await this.appointmentRepository.update(appointmentId, {
        isRecurring: false,
        recurringFrequency: '',
        recurringUntil: '',
      });
    }
    return await this.appointmentRepository.update(appointmentId, {
      isRecurring: true,
      recurringFrequency: recurringFrequency,
      recurringUntil: recurringUntil,
    });
  }
}
