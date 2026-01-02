import { DataSource } from 'typeorm';
import { CUSTOMER_REPOSITORY, DATA_SOURCE } from 'src/constants';
import { Customer } from './entities/customer.entity';

export const customerProviders = [
  {
    provide: CUSTOMER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Customer),
    inject: [DATA_SOURCE],
  },
];
