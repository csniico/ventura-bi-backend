/**
 * System roles that exist in every business
 * The 'Owner' role is created automatically (isSystem = true)
 */
export const SYSTEM_ROLES = {
  OWNER: 'Owner', // isSystem = true, full access
  MANAGER: 'Manager', // default role for business managers
  VIEWER: 'Viewer', // read-only access
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

/**
 * Default roles to create when a new business is created
 */
export const DEFAULT_BUSINESS_ROLES: SystemRole[] = [
  SYSTEM_ROLES.OWNER,
  SYSTEM_ROLES.MANAGER,
  SYSTEM_ROLES.VIEWER,
];
