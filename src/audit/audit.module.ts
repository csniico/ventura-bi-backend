import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { auditProviders } from './audit.providers';
import { DatabaseModule } from 'src/database/database.module';
import { BullModule } from '@nestjs/bullmq';
import { AuditProcessor } from './audit.processor';
import {
  AuditBaseService,
  AuthAuditService,
  UserAuditService,
  OrderAuditService,
  InvoiceAuditService,
  CustomerAuditService,
} from './services';

@Module({
  imports: [DatabaseModule, BullModule.registerQueue({ name: 'audit' })],
  controllers: [AuditController],
  providers: [
    ...auditProviders,
    AuditService,
    AuditProcessor,
    AuditBaseService,
    AuthAuditService,
    UserAuditService,
    OrderAuditService,
    InvoiceAuditService,
    CustomerAuditService,
  ],
  exports: [AuditService, AuditBaseService],
})
export class AuditModule {}
