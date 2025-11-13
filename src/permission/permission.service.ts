import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user has permission to perform action on resource in business
   * Returns true if allowed, false if denied or not found
   */
  async checkPermission(
    userId: string,
    businessId: string,
    action: string,
    resourceName: string,
  ): Promise<boolean> {
    // Get user's role in this business
    const businessUser = await this.prisma.businessUser.findUnique({
      where: {
        userId_businessId: { userId, businessId },
      },
      include: {
        role: true,
      },
    });

    if (!businessUser || !businessUser.isActive) {
      return false;
    }

    // Owner role has full access
    if (businessUser.role.isSystem) {
      return true;
    }

    // Find the resource
    const resource = await this.prisma.resource.findUnique({
      where: {
        name_businessId: { name: resourceName, businessId },
      },
    });

    if (!resource) {
      return false;
    }

    // Get all permissions: user-specific + role-based
    const permissions = await this.prisma.permission.findMany({
      where: {
        businessId,
        resourceId: resource.id,
        action,
        isActive: true,
        OR: [{ userId }, { roleId: businessUser.roleId }],
      },
    });

    // Evaluate: DENY takes precedence over ALLOW
    const hasDeny = permissions.some((p) => p.effect === 'DENY');
    const hasAllow = permissions.some((p) => p.effect === 'ALLOW');

    if (hasDeny) return false;
    if (hasAllow) return true;

    return false;
  }

  /**
   * Get all permissions for a user in a business
   */
  async getUserPermissions(userId: string, businessId: string) {
    const businessUser = await this.prisma.businessUser.findUnique({
      where: {
        userId_businessId: { userId, businessId },
      },
      include: {
        role: {
          include: {
            permissions: {
              where: { isActive: true },
              include: { resource: true },
            },
          },
        },
      },
    });

    if (!businessUser) {
      return [];
    }

    // Get user-specific permissions
    const userPermissions = await this.prisma.permission.findMany({
      where: {
        userId,
        businessId,
        isActive: true,
      },
      include: { resource: true },
    });

    // Combine role + user permissions
    return {
      role: businessUser.role.name,
      rolePermissions: businessUser.role.permissions,
      userPermissions,
    };
  }
}
