# Database Schema Guide

## Overview

This document explains the database schema structure for the Ventura BI backend service, a multi-tenant business intelligence system with role-based access control (RBAC) and compliance features.

## Core Entities

### User

**Purpose**: Represents authenticated users in the system.

**Key Fields**:

- `googleId`: OAuth identifier from Google authentication
- `email`: Unique email address
- `isActive`: Account status flag
- `isDeleted`, `deletedAt`: Soft-delete support for data retention compliance

**Relations**:

- Can belong to multiple businesses (via `BusinessUser`)
- Can have multiple devices and sessions
- Can have user-specific permissions (overrides role permissions)
- All actions logged in `AuditLog`

---

### Business

**Purpose**: Multi-tenant container for business operations.

**Key Fields**:

- `name`: Business name
- `isActive`: Business status

**Relations**:

- Has multiple users (via `BusinessUser`)
- Defines its own roles, resources, and permissions
- Isolated data per business (multi-tenancy)

---

### BusinessUser (Join Table)

**Purpose**: Links users to businesses with role assignments.

**Key Fields**:

- `userId`: Reference to User
- `businessId`: Reference to Business
- `roleId`: User's role in this business
- `isActive`: Membership status

**Constraints**:

- `@@unique([userId, businessId])`: A user can only be in a business once
- User can have different roles in different businesses

**Example Data**:

```
| userId | businessId | roleId  |
|--------|-----------|---------|
| user1  | biz1      | owner   |
| user1  | biz2      | cashier |
| user2  | biz1      | manager |
```

---

## Access Control System

### Role

**Purpose**: Defines job functions within a business.

**Key Fields**:

- `name`: Role name (e.g., 'Owner', 'Manager', 'Cashier')
- `isSystem`: `true` for built-in roles that shouldn't be deleted
- `businessId`: Each business defines its own roles

**Constraints**:

- `@@unique([name, businessId])`: Role names unique per business
- Different businesses can have same role names with different permissions

---

### Resource

**Purpose**: Defines what can be accessed or modified.

**Key Fields**:

- `name`: Resource identifier (e.g., 'products', 'orders', 'users', 'reports')
- `businessId`: Each business defines its own resources

**Constraints**:

- `@@unique([name, businessId])`: Resource names unique per business

**Common Resources**:

- `users` - User management
- `products` - Inventory/catalog
- `orders` - Transaction records
- `reports` - Analytics/BI data
- `settings` - Business configuration

---

### Permission

**Purpose**: Links actions on resources to roles or users.

**Key Fields**:

- `action`: What can be done ('create', 'read', 'update', 'delete', 'manage')
- `effect`: 'ALLOW' or 'DENY'
- `resourceId`: What resource this applies to
- `roleId`: If set, applies to all users with this role
- `userId`: If set, applies to specific user (overrides role)
- `businessId`: Scope of permission

**Permission Hierarchy**:

1. User-level DENY (highest priority)
2. User-level ALLOW
3. Role-level DENY
4. Role-level ALLOW
5. Default DENY (no permission = denied)

**Examples**:

```javascript
// Role permission: All Managers can read products
{ action: 'read', effect: 'ALLOW', resourceId: 'products', roleId: 'manager-id' }

// User override: This specific user can also create products
{ action: 'create', effect: 'ALLOW', resourceId: 'products', userId: 'user-id' }

// Explicit deny: Block this manager from deleting products
{ action: 'delete', effect: 'DENY', resourceId: 'products', userId: 'user-id' }
```

---

## Session Management

### Device

**Purpose**: Tracks user devices for security and session management.

**Key Fields**:

- `deviceId`: Unique device identifier
- `userId`: Optional (allows guest/pre-login device tracking)

**Relations**:

- Can have multiple sessions
- Optional user relationship (supports device registration before login)

---

### Session

**Purpose**: Manages user authentication sessions.

**Key Fields**:

- `sessionToken`: Unique session identifier
- `expiresAt`: Session expiration timestamp
- `userId`: Optional (supports anonymous sessions)
- `deviceId`: Optional (tracks which device)

**Security Features**:

- Automatic cleanup via `expiresAt`
- Device tracking for security audits
- Cascade delete when user/device is deleted

---

## Compliance & Audit

### AuditLog

**Purpose**: Compliance trail for data access (Ghana Data Protection Act 843, GDPR).

**Key Fields**:

- `action`: 'READ', 'CREATE', 'UPDATE', 'DELETE'
- `resource`: Resource type accessed
- `resourceId`: Specific record ID
- `status`: 'SUCCESS', 'DENIED', 'ERROR'
- `ipAddress`, `userAgent`: Request metadata
- `metadata`: Additional context (JSON)

**Indexes**:

- `[userId, createdAt]`: Fast user activity lookup
- `[businessId, createdAt]`: Fast business audit reports
- `[resource, resourceId]`: Fast resource access history

**Use Cases**:

- Security incident investigation
- Compliance reporting
- User activity monitoring
- Breach detection
- Data access right fulfillment

---

## Typical Workflows

### 1. User Registration & Business Creation

```typescript
// 1. Create user from Google OAuth
const user = await prisma.user.create({
  data: {
    googleId: profile.id,
    email: profile.email,
    firstname: profile.given_name,
    lastname: profile.family_name,
    avatar: profile.picture,
  },
});

// 2. Create business
const business = await prisma.business.create({
  data: {
    name: 'Acme Corp',
    description: 'Retail business',
  },
});

// 3. Create Owner role (system role)
const ownerRole = await prisma.role.create({
  data: {
    name: 'Owner',
    description: 'Full system access',
    isSystem: true,
    businessId: business.id,
  },
});

// 4. Link user to business as Owner
await prisma.businessUser.create({
  data: {
    userId: user.id,
    businessId: business.id,
    roleId: ownerRole.id,
  },
});

// 5. Create default resources
const resources = await prisma.resource.createMany({
  data: [
    { name: 'users', businessId: business.id },
    { name: 'products', businessId: business.id },
    { name: 'orders', businessId: business.id },
    { name: 'reports', businessId: business.id },
  ],
});

// 6. Grant Owner full permissions
const resourceList = await prisma.resource.findMany({
  where: { businessId: business.id },
});

await prisma.permission.createMany({
  data: resourceList.flatMap((resource) =>
    ['create', 'read', 'update', 'delete', 'manage'].map((action) => ({
      action,
      effect: 'ALLOW',
      resourceId: resource.id,
      roleId: ownerRole.id,
      businessId: business.id,
    })),
  ),
});
```

---

### 2. Authorization Middleware

```typescript
async function authorizeRequest(
  req: Request,
  resourceName: string,
  action: string,
): Promise<boolean> {
  const userId = req.user.id;
  const businessId = req.params.businessId || req.headers['x-business-id'];

  // 1. Verify user belongs to business
  const businessUser = await prisma.businessUser.findUnique({
    where: {
      userId_businessId: { userId, businessId },
    },
    include: { role: true },
  });

  if (!businessUser?.isActive) {
    await logAudit(userId, businessId, action, resourceName, null, 'DENIED');
    return false;
  }

  // 2. Get resource
  const resource = await prisma.resource.findFirst({
    where: { name: resourceName, businessId },
  });

  if (!resource) {
    await logAudit(userId, businessId, action, resourceName, null, 'ERROR');
    return false;
  }

  // 3. Check permissions (deny takes precedence)
  const permissions = await prisma.permission.findMany({
    where: {
      businessId,
      action,
      resourceId: resource.id,
      isActive: true,
      OR: [{ userId }, { roleId: businessUser.roleId }],
    },
  });

  // 4. Evaluate: User DENY > User ALLOW > Role DENY > Role ALLOW
  const userDeny = permissions.find(
    (p) => p.userId === userId && p.effect === 'DENY',
  );
  if (userDeny) {
    await logAudit(userId, businessId, action, resourceName, null, 'DENIED');
    return false;
  }

  const userAllow = permissions.find(
    (p) => p.userId === userId && p.effect === 'ALLOW',
  );
  if (userAllow) {
    await logAudit(userId, businessId, action, resourceName, null, 'SUCCESS');
    return true;
  }

  const roleDeny = permissions.find((p) => p.roleId && p.effect === 'DENY');
  if (roleDeny) {
    await logAudit(userId, businessId, action, resourceName, null, 'DENIED');
    return false;
  }

  const roleAllow = permissions.find((p) => p.roleId && p.effect === 'ALLOW');
  if (roleAllow) {
    await logAudit(userId, businessId, action, resourceName, null, 'SUCCESS');
    return true;
  }

  // Default deny
  await logAudit(userId, businessId, action, resourceName, null, 'DENIED');
  return false;
}

async function logAudit(
  userId: string,
  businessId: string,
  action: string,
  resource: string,
  resourceId: string | null,
  status: string,
) {
  await prisma.auditLog.create({
    data: {
      userId,
      businessId,
      action,
      resource,
      resourceId,
      status,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
}
```

---

### 3. Invite User to Business

```typescript
async function inviteUserToBusiness(
  inviterUserId: string,
  businessId: string,
  inviteeEmail: string,
  roleName: string,
) {
  // 1. Verify inviter has permission
  const canInvite = await authorizeRequest(
    { user: { id: inviterUserId }, params: { businessId } },
    'users',
    'create',
  );

  if (!canInvite) {
    throw new ForbiddenError('Cannot invite users');
  }

  // 2. Find or create invitee
  let invitee = await prisma.user.findUnique({
    where: { email: inviteeEmail },
  });

  if (!invitee) {
    // Send invitation email, create pending user, etc.
    throw new Error('User not found - implement invite flow');
  }

  // 3. Get role
  const role = await prisma.role.findFirst({
    where: { name: roleName, businessId },
  });

  if (!role) {
    throw new Error('Role not found');
  }

  // 4. Add user to business
  const businessUser = await prisma.businessUser.create({
    data: {
      userId: invitee.id,
      businessId,
      roleId: role.id,
    },
  });

  // 5. Log action
  await prisma.auditLog.create({
    data: {
      userId: inviterUserId,
      businessId,
      action: 'CREATE',
      resource: 'users',
      resourceId: invitee.id,
      status: 'SUCCESS',
      metadata: { invitedEmail: inviteeEmail, role: roleName },
    },
  });

  return businessUser;
}
```

---

### 4. Business Context Switching

```typescript
async function switchBusiness(userId: string, targetBusinessId: string) {
  // 1. Verify user has access to target business
  const businessUser = await prisma.businessUser.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: targetBusinessId,
      },
    },
    include: {
      business: true,
      role: true,
    },
  });

  if (!businessUser?.isActive) {
    throw new ForbiddenError('No access to this business');
  }

  // 2. Get user's permissions in this business
  const permissions = await prisma.permission.findMany({
    where: {
      businessId: targetBusinessId,
      OR: [{ userId }, { roleId: businessUser.roleId }],
      isActive: true,
    },
    include: {
      resource: true,
    },
  });

  // 3. Return business context
  return {
    businessId: businessUser.business.id,
    businessName: businessUser.business.name,
    roleId: businessUser.role.id,
    roleName: businessUser.role.name,
    permissions: permissions.map((p) => ({
      resource: p.resource.name,
      action: p.action,
      effect: p.effect,
    })),
  };
}
```

---

### 5. Compliance: Data Access Report

```typescript
async function generateDataAccessReport(
  businessId: string,
  startDate: Date,
  endDate: Date,
) {
  // Get all audit logs for the period
  const logs = await prisma.auditLog.findMany({
    where: {
      businessId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: { email: true, firstname: true, lastname: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate statistics
  const stats = {
    totalAccesses: logs.length,
    successfulAccesses: logs.filter((l) => l.status === 'SUCCESS').length,
    deniedAccesses: logs.filter((l) => l.status === 'DENIED').length,
    byResource: groupBy(logs, 'resource'),
    byUser: groupBy(logs, 'userId'),
    byAction: groupBy(logs, 'action'),
  };

  return { logs, stats };
}
```

---

### 6. User Data Deletion (GDPR/Data Protection Act Compliance)

```typescript
async function deleteUserData(userId: string, reason: string) {
  // 1. Soft-delete user
  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },
  });

  // 2. Deactivate all business memberships
  await prisma.businessUser.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  // 3. Expire all sessions
  await prisma.session.updateMany({
    where: { userId },
    data: { expiresAt: new Date() },
  });

  // 4. Log deletion (keep for compliance)
  await prisma.auditLog.create({
    data: {
      userId,
      businessId: 'SYSTEM',
      action: 'DELETE',
      resource: 'users',
      resourceId: userId,
      status: 'SUCCESS',
      metadata: { reason, deletionType: 'soft-delete' },
    },
  });

  // Note: Audit logs are retained for compliance
  // Hard deletion after retention period requires separate process
}
```

---

## Best Practices

### Multi-Tenancy

- Always scope queries by `businessId`
- Use middleware to inject `businessId` from session/JWT
- Validate business access before any operation

### Permission Checks

- Check permissions at the start of every protected endpoint
- Use explicit deny for exceptions (block specific users)
- Log all permission checks for audit trail

### Audit Logging

- Log all sensitive data access
- Include IP address and user agent
- Store enough context for forensic analysis
- Set up retention policies (typically 1-7 years)

### Data Deletion

- Use soft-delete for users (compliance requirement)
- Keep audit logs even after user deletion
- Hard-delete after legal retention period expires

### Performance

- Use indexes on foreign keys and frequently queried fields
- Cache permission checks (invalidate on permission changes)
- Batch audit log writes (use queue for high-volume systems)

---

## Migration Commands

```bash
# Format schema
npx prisma format

# Create migration
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Ghana Data Protection Act 843](https://www.dataprotection.org.gh/)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [ISO 27001 Access Control](https://www.iso.org/standard/54534.html)
