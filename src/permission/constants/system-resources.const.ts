/**
 * System-level resources that exist across all businesses
 * Note: Businesses can also define custom resources in the Resource table
 */
export const SYSTEM_RESOURCES = {
  USERS: 'users',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type SystemResource =
  (typeof SYSTEM_RESOURCES)[keyof typeof SYSTEM_RESOURCES];

/**
 * Resources that only Owner role can access
 */
export const OWNER_ONLY_RESOURCES: SystemResource[] = [
  SYSTEM_RESOURCES.ROLES,
  SYSTEM_RESOURCES.PERMISSIONS,
  SYSTEM_RESOURCES.SETTINGS,
];
