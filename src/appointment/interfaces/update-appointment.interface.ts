import { Customer } from 'src/customer/entities/customer.entity';
import { AppointmentStatus } from '../entities/appointment.entity';

export interface IUpdateAppointment {
  appointmentId: string;
  ownerId: string;
  businessId: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  notes?: string;
  status?: AppointmentStatus;
  customerId?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringUntil?: string;
}

export interface IUpdateAppointmentTitle {
  appointmentId: string;
  newTitle: string;
}

export interface IUpdateAppointmentStartTime {
  appointmentId: string;
  newStartTime: string;
}

export interface IUpdateAppointmentEndTime {
  appointmentId: string;
  newEndTime: string;
}

export interface IUpdateAppointmentDescription {
  appointmentId: string;
  newDescription: string;
}

export interface IUpdateAppointmentNotes {
  appointmentId: string;
  newNotes: string;
}

export interface IUpdateAppointmentStatus {
  appointmentId: string;
  newStatus: AppointmentStatus;
}

export interface IUpdateAppointmentCustomer {
  appointmentId: string;
  newCustomerId: string;
  newCustomer: Customer;
}

export interface IUpdateAppointmentRecurringDetails {
  appointmentId: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  recurringUntil?: string;
}
