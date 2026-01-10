import { DataSource } from 'typeorm';
import {
  DATA_SOURCE,
  PRODUCT_REPOSITORY,
  SERVICE_REPOSITORY,
} from 'src/constants';
import { Product } from './entities/product.entity';
import { Service } from './entities/service.entity';

export const resourceProviders = [
  {
    provide: PRODUCT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Product),
    inject: [DATA_SOURCE],
  },
  {
    provide: SERVICE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Service),
    inject: [DATA_SOURCE],
  },
];
