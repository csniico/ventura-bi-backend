import { DATA_SOURCE, INVOICE_REPOSITORY } from 'src/constants';
import { DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';

export const invoiceProviders = [
  {
    provide: INVOICE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Invoice),
    inject: [DATA_SOURCE],
  },
];
