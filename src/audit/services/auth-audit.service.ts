import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditBaseService } from './audit-base.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import {
  AuthLoginEvent,
  AuthLogoutEvent,
  AuthPasswordChangeEvent,
  AuthPasswordResetEvent,
  AuthTokenRefreshEvent,
} from '../events/auth-events';

@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger(AuthAuditService.name);

  constructor(private readonly auditBaseService: AuditBaseService) {}

  @OnEvent('auth.login')
  async handleLogin(event: AuthLoginEvent): Promise<void> {
    this.logger.debug(`Auditing login for user: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.LOGIN,
      entity: AuditEntity.AUTH,
      entityId: event.userId,
      userId: event.userId,
      metadata: {
        email: event.email,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        success: event.success,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('auth.logout')
  async handleLogout(event: AuthLogoutEvent): Promise<void> {
    this.logger.debug(`Auditing logout for user: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.LOGOUT,
      entity: AuditEntity.AUTH,
      entityId: event.userId,
      userId: event.userId,
      metadata: {
        email: event.email,
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('auth.password.change')
  async handlePasswordChange(event: AuthPasswordChangeEvent): Promise<void> {
    this.logger.debug(`Auditing password change for user: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.AUTH,
      entityId: event.userId,
      userId: event.userId,
      metadata: {
        email: event.email,
        action: 'password_change',
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('auth.password.reset')
  async handlePasswordReset(event: AuthPasswordResetEvent): Promise<void> {
    this.logger.debug(`Auditing password reset for user: ${event.email}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.UPDATE,
      entity: AuditEntity.AUTH,
      entityId: event.userId,
      userId: event.userId,
      metadata: {
        email: event.email,
        action: 'password_reset',
        timestamp: event.timestamp,
      },
    });
  }

  @OnEvent('auth.token.refresh')
  async handleTokenRefresh(event: AuthTokenRefreshEvent): Promise<void> {
    this.logger.debug(`Auditing token refresh for user: ${event.userId}`);

    await this.auditBaseService.queueAuditLog({
      action: AuditAction.READ,
      entity: AuditEntity.AUTH,
      entityId: event.userId,
      userId: event.userId,
      metadata: {
        action: 'token_refresh',
        timestamp: event.timestamp,
      },
    });
  }
}
