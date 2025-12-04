import { DataSource } from 'typeorm';
import { DATA_SOURCE, MAILER_REPOSITORY } from 'src/constants';
import { Mail } from './entities/mail.entity';

export const mailerProviders = [
  {
    provide: MAILER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Mail),
    inject: [DATA_SOURCE],
  },
];
