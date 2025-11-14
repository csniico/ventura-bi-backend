import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../permission/permission.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.businessId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check each required permission (format: "action:resource")
    for (const permission of requiredPermissions) {
      const [action, resourceName] = permission.split(':');

      if (!action || !resourceName) {
        continue; // Invalid format, skip
      }

      const hasPermission = await this.permissionService.checkPermission(
        user.id,
        user.businessId,
        action,
        resourceName,
      );

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true; // User has all required permissions
  }
}
