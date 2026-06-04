import { Injectable, Logger, Inject } from '@nestjs/common';
import type { Message } from '@aws-sdk/client-sqs';
import { SqsMessageHandler, SqsConsumerEventHandler } from '@ssut/nestjs-sqs';
import { Repository } from 'typeorm';
import { AUDIT_REPOSITORY } from 'src/constants';
import { Audit } from './entities/audit.entity';
import { AuditAction } from 'src/audit/enums';
import { AuditEntity } from 'src/audit/enums';
import { AuditJobPayload } from './interfaces/audit-job-payload.interface';

@Injectable()
export class AuditConsumer {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: Repository<Audit>,
  ) {}

  @SqsMessageHandler('audit-consumer', false)
  async handleMessage(message: Message): Promise<void> {
    const payload = this.parsePayload(message);
    await this.persistAuditLog(payload, message.MessageId ?? 'unknown');
  }

  @SqsConsumerEventHandler('audit-consumer', 'processing_error')
  onProcessingError(error: Error, message: Message) {
    this.logger.error(
      `Audit consumer processing error for message ${message?.MessageId ?? 'unknown'}: ${error.message}`,
      error.stack,
    );
  }

  private parsePayload(message: Message): AuditJobPayload {
    if (!message.Body) {
      throw new Error(
        `Audit message ${message.MessageId ?? 'unknown'} has empty body`,
      );
    }

    let parsed: AuditJobPayload;

    try {
      parsed = JSON.parse(message.Body) as AuditJobPayload;
    } catch {
      throw new Error(
        `Audit message ${message.MessageId ?? 'unknown'} body is not valid JSON`,
      );
    }

    if (!parsed.action || !parsed.entity) {
      throw new Error(
        `Audit message ${message.MessageId ?? 'unknown'} is missing required fields`,
      );
    }

    return parsed;
  }

  private async persistAuditLog(
    data: AuditJobPayload,
    messageId: string,
  ): Promise<void> {
    const audit = this.auditRepository.create({
      action: data.action as AuditAction,
      entity: data.entity as AuditEntity,
      entityId: data.entityId,
      userId: data.userId,
      metadata: data.metadata,
    });

    await this.auditRepository.save(audit);
    this.logger.debug(
      `Saved audit log from message ${messageId}: ${data.action} on ${data.entity}`,
    );
  }
}
