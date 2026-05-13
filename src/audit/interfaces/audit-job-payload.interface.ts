import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';

export interface AuditJobPayload {
  action: AuditAction | string;
  entity: AuditEntity | string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}
