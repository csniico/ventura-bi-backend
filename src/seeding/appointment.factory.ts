import {
  Appointment,
  AppointmentStatus,
} from 'src/appointment/entities/appointment.entity';
import { setSeederFactory } from 'typeorm-extension';

export const AppointmentFactory = setSeederFactory(Appointment, (faker) => {
  const appointment = new Appointment();
  const startTime = faker.date.soon({ days: 30 });
  const endTime = new Date(
    startTime.getTime() + faker.number.int({ min: 30, max: 180 }) * 60000,
  ); // 30-180 minutes

  appointment.title = faker.helpers.arrayElement([
    'Consultation',
    'Follow-up Meeting',
    'Product Demo',
    'Strategy Session',
    'Review Meeting',
    'Client Check-in',
  ]);
  appointment.description = `Meeting with client to discuss ${faker.company.buzzPhrase()}. Please bring relevant documents and materials.`;
  appointment.startTime = startTime;
  appointment.endTime = endTime;
  appointment.status = faker.helpers.arrayElement(
    Object.values(AppointmentStatus),
  );
  appointment.location = faker.helpers.arrayElement([
    'Office',
    'Online - Zoom',
    'Client Site',
    'Phone Call',
    faker.location.streetAddress(),
  ]);
  appointment.notes = `Appointment scheduled by ${faker.company.name()} staff. Confirmed via ${faker.helpers.arrayElement(['email', 'phone', 'SMS'])}.`;
  appointment.reminderSent = faker.datatype.boolean({ probability: 0.4 });
  if (appointment.reminderSent) {
    appointment.reminderSentAt = faker.date.recent({ days: 7 });
  }

  return appointment;
});
