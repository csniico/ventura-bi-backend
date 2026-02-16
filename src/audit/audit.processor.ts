import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Audit } from './entities/audit.entity';
import { AUDIT_REPOSITORY } from 'src/constants';
import { AuditAction } from './enums/audit-action.enum';
import { AuditEntity } from './enums/audit-entity.enum';

export interface AuditJobPayload {
  action: AuditAction | string;
  entity: AuditEntity | string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

@Processor('audit')
@Injectable()
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: Repository<Audit>,
  ) {
    super();
  }

  async process(job: Job<AuditJobPayload>): Promise<void> {
    this.logger.log(`Processing audit job ${job.id} for ${job.data.entity}`);

    try {
      // Save audit log to database
      await this.processAuditLog(job.data);
      this.logger.log(`Successfully processed audit job ${job.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process audit job ${job.id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  private async processAuditLog(data: AuditJobPayload): Promise<void> {
    // Save to database
    const audit = this.auditRepository.create({
      action: data.action as AuditAction,
      entity: data.entity as AuditEntity,
      entityId: data.entityId,
      userId: data.userId,
      metadata: data.metadata,
    });

    await this.auditRepository.save(audit);
    this.logger.debug(
      `Saved audit log: ${data.action} on ${data.entity} (${data.entityId})`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<AuditJobPayload>) {
    this.logger.debug(`Audit job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<AuditJobPayload>, error: Error) {
    this.logger.error(
      `Audit job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<AuditJobPayload>) {
    this.logger.debug(`Audit job ${job.id} is now active`);
  }
}
