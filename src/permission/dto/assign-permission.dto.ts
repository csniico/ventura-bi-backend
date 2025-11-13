export class AssignPermissionDto {
  action: string;
  resourceName: string;
  effect: 'ALLOW' | 'DENY';
  roleId?: string;
  userId?: string;
  businessId?: string;
}
