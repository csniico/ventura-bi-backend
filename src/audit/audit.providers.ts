import { DataSource } from 'typeorm';
import { DATA_SOURCE, AUDIT_REPOSITORY } from 'src/constants';
import { Audit } from './entities/audit.entity';

export const auditProviders = [
  {
    provide: AUDIT_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Audit),
    inject: [DATA_SOURCE],
  },
];
