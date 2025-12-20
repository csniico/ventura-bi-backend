import { DataSource } from 'typeorm';
import {
  APPOINTMENT_REPOSITORY,
  BUSINESS_REPOSITORY,
  DATA_SOURCE,
  USER_REPOSITORY,
} from 'src/constants';
import { Business } from 'src/business/entities/business.entity';
import { User } from 'src/user/entities/user.entity';
import { Appointment } from 'src/appointment/entities/appointment.entity';

export const appointmentProviders = [
  {
    provide: USER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [DATA_SOURCE],
  },
  {
    provide: BUSINESS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Business),
    inject: [DATA_SOURCE],
  },
  {
    provide: APPOINTMENT_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Appointment),
    inject: [DATA_SOURCE],
  },
];
