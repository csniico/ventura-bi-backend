import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { auditProviders } from './audit.providers';
import { DatabaseModule } from 'src/database/database.module';
import {
  AuditBaseService,
  AuthAuditService,
  UserAuditService,
  OrderAuditService,
  InvoiceAuditService,
  CustomerAuditService,
} from './services';
import { AuditConsumer } from 'src/audit/audit.consumer';
import { AuditDlqService } from './audit-dlq.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
  providers: [
    ...auditProviders,
    AuditService,
    AuditBaseService,
    AuthAuditService,
    UserAuditService,
    OrderAuditService,
    InvoiceAuditService,
    CustomerAuditService,
    AuditConsumer,
    AuditDlqService,
  ],
  exports: [AuditService, AuditBaseService],
})
export class AuditModule {}
