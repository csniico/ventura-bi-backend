import { DataSource } from 'typeorm';
import { BUSINESS_REPOSITORY, DATA_SOURCE } from 'src/constants';
import { Business } from 'src/business/entities/business.entity';

export const businessProviders = [
  {
    provide: BUSINESS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Business),
    inject: [DATA_SOURCE],
  },
];
