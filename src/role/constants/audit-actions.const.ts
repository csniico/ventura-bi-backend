/**
 * Actions that get logged in AuditLog table
 * Maps to AuditLog.action field
 */
export const AUDIT_ACTIONS = {
  READ: 'READ',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Status codes for audit logs
 * Maps to AuditLog.status field
 */
export const AUDIT_STATUS = {
  SUCCESS: 'SUCCESS',
  DENIED: 'DENIED',
  ERROR: 'ERROR',
} as const;

export type AuditStatus = (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS];
