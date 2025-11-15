import { Role } from "src/user/entities/role.entity";
import { setSeederFactory } from "typeorm-extension";

export const RoleFactory = setSeederFactory(Role, (faker) => {
    const role = new Role();
    role.name = faker.helpers.arrayElement([
        'admin',
        'manager',
        'editor',
        'viewer',
        'accountant',
        'sales',
        'support',
        'moderator'
    ]);
    role.description = `Role for ${role.name} with specific permissions`;
    role.isActive = faker.datatype.boolean({ probability: 0.9 });

    return role;
});
