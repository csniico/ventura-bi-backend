/**
 * Standard CRUD + special actions for permission system
 * These match the 'action' field in Permission model
 */
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // full control over resource
} as const;

export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];

/**
 * Helper to validate if an action is valid
 */
export const isValidPermissionAction = (
  action: string,
): action is PermissionAction => {
  return Object.values(PERMISSION_ACTIONS).includes(action as PermissionAction);
};

/**
 * Action hierarchy: manage > all others
 * If user has 'manage', they have all actions
 */
export const ACTION_HIERARCHY: Record<PermissionAction, PermissionAction[]> = {
  [PERMISSION_ACTIONS.MANAGE]: [
    PERMISSION_ACTIONS.CREATE,
    PERMISSION_ACTIONS.READ,
    PERMISSION_ACTIONS.UPDATE,
    PERMISSION_ACTIONS.DELETE,
    PERMISSION_ACTIONS.MANAGE,
  ],
  [PERMISSION_ACTIONS.CREATE]: [PERMISSION_ACTIONS.CREATE],
  [PERMISSION_ACTIONS.READ]: [PERMISSION_ACTIONS.READ],
  [PERMISSION_ACTIONS.UPDATE]: [PERMISSION_ACTIONS.UPDATE],
  [PERMISSION_ACTIONS.DELETE]: [PERMISSION_ACTIONS.DELETE],
};
