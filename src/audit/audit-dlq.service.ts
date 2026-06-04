import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { SqsService } from '@ssut/nestjs-sqs';
import { randomUUID } from 'node:crypto';
import { AuditJobPayload } from './interfaces/audit-job-payload.interface';

interface ReplayDlqOptions {
  messageIds?: string[];
  maxMessages?: number;
}

interface DlqMessagePreview {
  messageId: string;
  receiveCount: number;
  sentTimestamp?: number;
  body: string;
  parsedBody: AuditJobPayload | null;
  isValidPayload: boolean;
}

interface ReplayItemResult {
  messageId: string;
  status: 'replayed' | 'failed' | 'skipped';
  reason?: string;
}

@Injectable()
export class AuditDlqService {
  private readonly logger = new Logger(AuditDlqService.name);
  private readonly sqsClient = new SQSClient({
    region: process.env.AWS_REGION,
  });

  constructor(private readonly sqsService: SqsService) {}

  async inspect(maxMessages = 10): Promise<DlqMessagePreview[]> {
    const messages = await this.receiveDlqMessages(maxMessages);

    return messages.map((message) => {
      const parsed = this.tryParsePayload(message.Body);
      const sentTimestamp = Number.parseInt(
        message.Attributes?.SentTimestamp ?? '',
        10,
      );
      const receiveCount = Number.parseInt(
        message.Attributes?.ApproximateReceiveCount ?? '0',
        10,
      );

      return {
        messageId: message.MessageId ?? 'unknown',
        receiveCount: Number.isNaN(receiveCount) ? 0 : receiveCount,
        sentTimestamp: Number.isNaN(sentTimestamp) ? undefined : sentTimestamp,
        body: message.Body ?? '',
        parsedBody: parsed,
        isValidPayload: parsed !== null,
      };
    });
  }

  async replaySequentially(options: ReplayDlqOptions = {}) {
    const maxMessages = options.maxMessages ?? 10;
    const requestedIds = new Set(options.messageIds ?? []);

    const messages = await this.receiveDlqMessages(maxMessages);
    const selectedMessages =
      requestedIds.size > 0
        ? messages.filter((message) =>
            requestedIds.has(message.MessageId ?? ''),
          )
        : messages;

    const results: ReplayItemResult[] = [];

    for (let index = 0; index < selectedMessages.length; index += 1) {
      const message = selectedMessages[index];
      const messageId = message.MessageId ?? `unknown-${index}`;

      try {
        const payload = this.parsePayloadOrThrow(message.Body, messageId);

        await this.sqsService.send('audit-producer', {
          id: randomUUID(),
          body: JSON.stringify(payload),
        });

        await this.deleteDlqMessage(message.ReceiptHandle, messageId);

        results.push({ messageId, status: 'replayed' });
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'Unknown replay error';

        results.push({ messageId, status: 'failed', reason });

        for (
          let remainder = index + 1;
          remainder < selectedMessages.length;
          remainder += 1
        ) {
          results.push({
            messageId:
              selectedMessages[remainder].MessageId ?? `unknown-${remainder}`,
            status: 'skipped',
            reason: 'Skipped because replay stops on first failure',
          });
        }

        return {
          success: false,
          replayedCount: results.filter((item) => item.status === 'replayed')
            .length,
          failedMessageId: messageId,
          results,
        };
      }
    }

    return {
      success: true,
      replayedCount: results.filter((item) => item.status === 'replayed')
        .length,
      results,
    };
  }

  private async receiveDlqMessages(maxMessages: number): Promise<Message[]> {
    const dlqUrl = this.getDlqUrl();

    const response = await this.sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: dlqUrl,
        MaxNumberOfMessages: Math.min(Math.max(maxMessages, 1), 10),
        AttributeNames: ['All'],
        MessageAttributeNames: ['All'],
        VisibilityTimeout: 30,
      }),
    );

    return response.Messages ?? [];
  }

  private async deleteDlqMessage(
    receiptHandle: string | undefined,
    messageId: string,
  ): Promise<void> {
    if (!receiptHandle) {
      throw new Error(`Message ${messageId} has no receipt handle for delete`);
    }

    await this.sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: this.getDlqUrl(),
        ReceiptHandle: receiptHandle,
      }),
    );
  }

  private tryParsePayload(body: string | undefined): AuditJobPayload | null {
    if (!body) {
      return null;
    }

    try {
      const parsed = JSON.parse(body) as AuditJobPayload;

      if (!parsed.action || !parsed.entity) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private parsePayloadOrThrow(
    body: string | undefined,
    messageId: string,
  ): AuditJobPayload {
    const parsed = this.tryParsePayload(body);

    if (!parsed) {
      throw new Error(
        `Message ${messageId} does not contain a valid AuditJobPayload`,
      );
    }

    return parsed;
  }

  private getDlqUrl(): string {
    const dlqUrl = process.env.SQS_AUDIT_DLQ_URL;

    if (!dlqUrl) {
      this.logger.error('Audit DLQ URL is not configured');
      throw new Error('Audit DLQ URL is not configured');
    }

    return dlqUrl;
  }
}
