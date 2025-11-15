import { Permission } from "src/user/entities/permission.entity";
import { setSeederFactory } from "typeorm-extension";

export const PermissionFactory = setSeederFactory(Permission, (faker) => {
    const permission = new Permission();
    const resource = faker.helpers.arrayElement([
        'user',
        'customer',
        'product',
        'order',
        'invoice',
        'appointment',
        'business',
        'report'
    ]);
    const action = faker.helpers.arrayElement([
        'create',
        'read',
        'update',
        'delete',
        'list',
        'export'
    ]);

    permission.name = `${resource}.${action}`;
    permission.resource = resource;
    permission.action = action;
    permission.description = `Permission to ${action} ${resource}`;
    permission.isActive = faker.datatype.boolean({ probability: 0.95 });

    return permission;
});
