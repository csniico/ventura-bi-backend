import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditBaseService } from './audit-base.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import {
  InvoiceCreatedEvent,
  InvoiceUpdatedEvent,
  InvoicePaidEvent,
  InvoiceCancelledEvent,
  InvoiceSentEvent,
} from '../events/invoice-events';

@Injectable()
export class InvoiceAuditService {
  private readonly logger = new Logger(InvoiceAuditService.name);

  constructor(private readonly auditBaseService: AuditBaseService) {}

  @OnEvent('invoice.created')
  async handleInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    this.logger.debug(`Auditing invoice creation: ${event.invoiceId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.INVOICE,
      entityId: event.invoiceId,
      userId: event.createdBy,
      metadata: {
        orderId: event.orderId,
        customerId: event.customerId,
        totalAmount: event.totalAmount,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('invoice.updated')
  async handleInvoiceUpdated(event: InvoiceUpdatedEvent): Promise<void> {
    this.logger.debug(`Auditing invoice update: ${event.invoiceId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.INVOICE,
      entityId: event.invoiceId,
      userId: event.updatedBy,
      metadata: {
        customerId: event.customerId,
        updatedFields: event.updatedFields,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('invoice.paid')
  async handleInvoicePaid(event: InvoicePaidEvent): Promise<void> {
    this.logger.debug(`Auditing invoice payment: ${event.invoiceId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.INVOICE,
      entityId: event.invoiceId,
      userId: event.paidBy,
      metadata: {
        customerId: event.customerId,
        amountPaid: event.amountPaid,
        paymentMethod: event.paymentMethod,
        status: 'paid',
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('invoice.cancelled')
  async handleInvoiceCancelled(event: InvoiceCancelledEvent): Promise<void> {
    this.logger.debug(`Auditing invoice cancellation: ${event.invoiceId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.CANCEL,
      entity: AuditEntity.INVOICE,
      entityId: event.invoiceId,
      userId: event.cancelledBy,
      metadata: {
        customerId: event.customerId,
        reason: event.reason,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('invoice.sent')
  async handleInvoiceSent(event: InvoiceSentEvent): Promise<void> {
    this.logger.debug(`Auditing invoice sent: ${event.invoiceId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.SEND,
      entity: AuditEntity.INVOICE,
      entityId: event.invoiceId,
      userId: event.sentBy,
      metadata: {
        customerId: event.customerId,
        recipientEmail: event.recipientEmail,
        timestamp: event.timestamp,
      },
    });
  }
}
