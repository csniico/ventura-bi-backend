import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { AuditEntity } from './enums/audit-entity.enum';
import { AuditAction } from './enums/audit-action.enum';
import { AuditDlqService } from './audit-dlq.service';

interface ReplayDlqRequest {
  messageIds?: string[];
  maxMessages?: number;
}

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditDlqService: AuditDlqService,
  ) {}

  /**
   * GET /audit/entity/:entity/:entityId
   * Returns all audit logs for a specific record (e.g. an order, invoice, customer)
   */
  @Get('entity/:entity/:entityId')
  async getEntityLogs(
    @Param('entity') entity: AuditEntity,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityLogs(entity, entityId);
  }

  /**
   * GET /audit/user/:userId
   * Returns all audit logs performed by or on a specific user
   */
  @Get('user/:userId')
  async getUserLogs(@Param('userId') userId: string) {
    return this.auditService.getUserLogs(userId);
  }

  /**
   * GET /audit/actions?action=CREATE
   * Returns all audit logs for a specific action type
   */
  @Get('actions')
  async getActionLogs(@Query('action') action: AuditAction) {
    return this.auditService.getActionLogs(action);
  }

  @Get('dlq')
  async getDlqMessages(@Query('maxMessages') maxMessages?: string) {
    const parsedMax = maxMessages ? Number.parseInt(maxMessages, 10) : 10;
    await this.auditDlqService.inspect(
      Number.isNaN(parsedMax) ? 10 : parsedMax,
    );
  }

  @Post('dlq/replay')
  async replayDlqMessages(@Body() body: ReplayDlqRequest = {}) {
    await this.auditDlqService.replaySequentially({
      messageIds: body.messageIds,
      maxMessages: body.maxMessages,
    });
  }
}
