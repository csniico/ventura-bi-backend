import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditBaseService } from './audit-base.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import {
  OrderCreatedEvent,
  OrderUpdatedEvent,
  OrderCancelledEvent,
  OrderCompletedEvent,
  OrderStatusChangedEvent,
} from '../events/order-events';

@Injectable()
export class OrderAuditService {
  private readonly logger = new Logger(OrderAuditService.name);

  constructor(private readonly auditBaseService: AuditBaseService) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    this.logger.debug(`Auditing order creation: ${event.orderId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.ORDER,
      entityId: event.orderId,
      userId: event.createdBy,
      metadata: {
        customerId: event.customerId,
        totalAmount: event.totalAmount,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('order.updated')
  async handleOrderUpdated(event: OrderUpdatedEvent): Promise<void> {
    this.logger.debug(`Auditing order update: ${event.orderId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.ORDER,
      entityId: event.orderId,
      userId: event.updatedBy,
      metadata: {
        customerId: event.customerId,
        updatedFields: event.updatedFields,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    this.logger.debug(`Auditing order cancellation: ${event.orderId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.CANCEL,
      entity: AuditEntity.ORDER,
      entityId: event.orderId,
      userId: event.cancelledBy,
      metadata: {
        customerId: event.customerId,
        reason: event.reason,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('order.completed')
  async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    this.logger.debug(`Auditing order completion: ${event.orderId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.ORDER,
      entityId: event.orderId,
      userId: event.completedBy,
      metadata: {
        customerId: event.customerId,
        totalAmount: event.totalAmount,
        status: 'completed',
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('order.status.changed')
  async handleOrderStatusChanged(
    event: OrderStatusChangedEvent,
  ): Promise<void> {
    this.logger.debug(`Auditing order status change: ${event.orderId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.ORDER,
      entityId: event.orderId,
      userId: event.changedBy,
      metadata: {
        customerId: event.customerId,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
        timestamp: event.timestamp,
      },
    });
  }
}
