/**
 * Example: How to emit audit events from your services
 *
 * This file demonstrates how to integrate audit logging into your modules
 *
 * NOTE: This is EXAMPLE CODE ONLY - not meant to be imported or compiled.
 * Use it as a reference when implementing audit events in your actual services.
 */

/* eslint-disable */
// @ts-nocheck

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AuthLoginEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  OrderCreatedEvent,
  InvoiceCreatedEvent,
  InvoicePaidEvent,
} from './events';

// ============================================
// Example 1: Auth Service
// ============================================
@Injectable()
export class ExampleAuthService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async login(email: string, password: string, req: any) {
    // Your authentication logic here
    const user = { id: 'user-123', email };

    // Emit login event
    this.eventEmitter.emit('auth.login', {
      userId: user.id,
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
      timestamp: new Date(),
    } as AuthLoginEvent);

    return user;
  }

  async logout(userId: string, email: string) {
    // Your logout logic here

    // Emit logout event
    this.eventEmitter.emit('auth.logout', {
      userId,
      email,
      timestamp: new Date(),
    });
  }
}

// ============================================
// Example 2: User Service
// ============================================
@Injectable()
export class ExampleUserService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createUser(data: any, createdBy: string) {
    // Your user creation logic
    const user = { id: 'new-user-id', ...data };

    // Emit user created event
    this.eventEmitter.emit('user.created', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdBy,
      timestamp: new Date(),
    } as UserCreatedEvent);

    return user;
  }

  async updateUser(userId: string, updates: any, updatedBy: string) {
    // Your update logic
    const updatedFields = Object.keys(updates);

    // Emit user updated event
    this.eventEmitter.emit('user.updated', {
      userId,
      email: 'user@example.com',
      updatedFields,
      updatedBy,
      timestamp: new Date(),
    } as UserUpdatedEvent);
  }
}

// ============================================
// Example 3: Order Service
// ============================================
@Injectable()
export class ExampleOrderService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createOrder(customerId: string, items: any[], createdBy: string) {
    // Your order creation logic
    const order = {
      id: 'order-123',
      customerId,
      totalAmount: 1000,
    };

    // Emit order created event
    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      createdBy,
      timestamp: new Date(),
    } as OrderCreatedEvent);

    return order;
  }

  async cancelOrder(orderId: string, reason: string, cancelledBy: string) {
    // Your cancellation logic

    // Emit order cancelled event
    this.eventEmitter.emit('order.cancelled', {
      orderId,
      customerId: 'customer-123',
      reason,
      cancelledBy,
      timestamp: new Date(),
    });
  }
}

// ============================================
// Example 4: Invoice Service
// ============================================
@Injectable()
export class ExampleInvoiceService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createInvoice(orderId: string, customerId: string, createdBy: string) {
    // Your invoice creation logic
    const invoice = {
      id: 'invoice-123',
      orderId,
      customerId,
      totalAmount: 1000,
    };

    // Emit invoice created event
    this.eventEmitter.emit('invoice.created', {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      customerId: invoice.customerId,
      totalAmount: invoice.totalAmount,
      createdBy,
      timestamp: new Date(),
    } as InvoiceCreatedEvent);

    return invoice;
  }

  async markAsPaid(
    invoiceId: string,
    customerId: string,
    amount: number,
    paymentMethod: string,
    paidBy: string,
  ) {
    // Your payment processing logic

    // Emit invoice paid event
    this.eventEmitter.emit('invoice.paid', {
      invoiceId,
      customerId,
      amountPaid: amount,
      paymentMethod,
      paidBy,
      timestamp: new Date(),
    } as InvoicePaidEvent);
  }

  async sendInvoice(
    invoiceId: string,
    customerId: string,
    recipientEmail: string,
    sentBy: string,
  ) {
    // Your email sending logic

    // Emit invoice sent event
    this.eventEmitter.emit('invoice.sent', {
      invoiceId,
      customerId,
      recipientEmail,
      sentBy,
      timestamp: new Date(),
    });
  }
}

/**
 * IMPORTANT NOTES:
 *
 * 1. Always emit events AFTER successful operations
 * 2. Include all required fields from the event interface
 * 3. Use the exact event names (e.g., 'user.created', not 'userCreated')
 * 4. Event emission is fire-and-forget - it won't block your code
 * 5. Failed events are logged but won't crash your service
 * 6. Audit logs are processed asynchronously via queue
 */
