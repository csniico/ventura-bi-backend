import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Permission } from 'src/user/entities/permission.entity';
import { Role } from 'src/user/entities/role.entity';
import { User } from 'src/user/entities/user.entity';
import { Business } from 'src/business/entities/business.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { Product } from 'src/product/entities/product.entity';
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Order } from 'src/order/entities/order.entity';
import { OrderItem } from 'src/order/entities/order-item.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';

export class MainSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {

        console.log('Seeding permissions...');
        const permissionRepository = dataSource.getRepository(Permission);

        const resources = ['user', 'role', 'business', 'customer', 'product', 'order', 'invoice', 'appointment'];
        const actions = ['create', 'read', 'update', 'delete'];

        const permissionsToCreate: Permission[] = [];
        for (const resource of resources) {
            for (const action of actions) {
                const permission = new Permission();
                permission.name = `${resource}.${action}`;
                permission.resource = resource;
                permission.action = action;
                permission.description = `Permission to ${action} ${resource}`;
                permission.isActive = true;
                permissionsToCreate.push(permission);
            }
        }

        const permissions = await permissionRepository.save(permissionsToCreate);
        console.log(`Created ${permissions.length} permissions`);

        console.log('Seeding roles...');
        const roleRepository = dataSource.getRepository(Role);

        const rolesToCreate: Role[] = [];
        const roleDefinitions = [
            { name: 'admin', description: 'Administrator with full access' },
            { name: 'manager', description: 'Manager with business management access' },
            { name: 'editor', description: 'Editor with content management access' },
            { name: 'viewer', description: 'Viewer with read-only access' },
            { name: 'accountant', description: 'Accountant with financial access' }
        ];

        for (const roleDef of roleDefinitions) {
            const role = new Role();
            role.name = roleDef.name;
            role.description = roleDef.description;
            role.isActive = true;
            rolesToCreate.push(role);
        }

        const roles = await roleRepository.save(rolesToCreate);
        console.log(`Created ${roles.length} roles`);

        for (const role of roles) {
            const randomPermissions = permissions
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 10) + 3);
            role.permissions = randomPermissions;
            await dataSource.getRepository(Role).save(role);
        }
        console.log(`Created ${roles.length} roles`);

        console.log('Seeding users...');
        const userFactory = factoryManager.get(User);
        const users = await userFactory.saveMany(3);

        for (const user of users) {
            const randomRoles = roles
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 2) + 1);
            user.roles = randomRoles;
            await dataSource.getRepository(User).save(user);
        }
        console.log(`Created ${users.length} users`);

        console.log('Seeding businesses...');
        const businessFactory = factoryManager.get(Business);
        const businesses: Business[] = [];

        for (let i = 0; i < 3; i++) {
            const business = await businessFactory.make();
            business.owner = users[i];
            business.ownerId = users[i].id;
            const savedBusiness = await dataSource.getRepository(Business).save(business);
            businesses.push(savedBusiness);
        }
        console.log(`Created ${businesses.length} businesses`);

        console.log('Assigning employees to businesses...');
        for (let i = 3; i < users.length; i++) {
            users[i].business = businesses[i % businesses.length];
            users[i].businessId = businesses[i % businesses.length].id;
            await dataSource.getRepository(User).save(users[i]);
        }

        console.log('Seeding customers...');
        const customerFactory = factoryManager.get(Customer);
        const allCustomers: Customer[] = [];

        for (const business of businesses) {
            for (let i = 0; i < 5; i++) {
                const customer = await customerFactory.make();
                customer.business = business;
                customer.businessId = business.id;
                const savedCustomer = await dataSource.getRepository(Customer).save(customer);
                allCustomers.push(savedCustomer);
            }
        }
        console.log(`Created ${allCustomers.length} customers`);

        console.log('Seeding products...');
        const productFactory = factoryManager.get(Product);
        const allProducts: Product[] = [];

        for (const business of businesses) {
            for (let i = 0; i < 5; i++) {
                const product = await productFactory.make();
                product.business = business;
                product.businessId = business.id;
                const savedProduct = await dataSource.getRepository(Product).save(product);
                allProducts.push(savedProduct);
            }
        }
        console.log(`Created ${allProducts.length} products`);

        console.log('Seeding appointments...');
        const appointmentFactory = factoryManager.get(Appointment);
        const businessCustomers: { [key: string]: Customer[] } = {};
        const businessEmployees: { [key: string]: User[] } = {};

        for (const business of businesses) {
            businessCustomers[business.id] = allCustomers.filter(c => c.businessId === business.id);
            businessEmployees[business.id] = users.filter(u => u.businessId === business.id);
        }

        for (const business of businesses) {
            const customers = businessCustomers[business.id];
            const employees = businessEmployees[business.id];
            const owner = business.owner;

            for (let i = 0; i < 5; i++) {
                const appointment = await appointmentFactory.make();
                appointment.business = business;
                appointment.businessId = business.id;
                appointment.customer = customers[Math.floor(Math.random() * customers.length)];
                appointment.customerId = appointment.customer.id;
                appointment.organizer = owner;
                appointment.organizerId = owner.id;

                if (employees.length > 0 && Math.random() > 0.3) {
                    appointment.assignedTo = employees[Math.floor(Math.random() * employees.length)];
                    appointment.assignedToId = appointment.assignedTo.id;
                }

                await dataSource.getRepository(Appointment).save(appointment);
            }
        }
        console.log('Created appointments');

        console.log('Seeding orders...');
        const orderFactory = factoryManager.get(Order);
        const orderItemFactory = factoryManager.get(OrderItem);
        const businessProducts: { [key: string]: Product[] } = {};

        for (const business of businesses) {
            businessProducts[business.id] = allProducts.filter(p => p.businessId === business.id);
        }

        for (const business of businesses) {
            const customers = businessCustomers[business.id];
            const products = businessProducts[business.id];

            for (let i = 0; i < 5; i++) {
                const order = await orderFactory.make();
                order.business = business;
                order.businessId = business.id;
                order.customer = customers[Math.floor(Math.random() * customers.length)];
                order.customerId = order.customer.id;

                const savedOrder = await dataSource.getRepository(Order).save(order);

                const itemCount = Math.floor(Math.random() * 5) + 1;
                for (let i = 0; i < itemCount; i++) {
                    const orderItem = await orderItemFactory.make();
                    orderItem.order = savedOrder;
                    orderItem.orderId = savedOrder.id;
                    orderItem.product = products[Math.floor(Math.random() * products.length)];
                    orderItem.productId = orderItem.product.id;
                    await dataSource.getRepository(OrderItem).save(orderItem);
                }
            }
        }
        console.log('Created orders with items');

        console.log('Seeding invoices...');
        const invoiceFactory = factoryManager.get(Invoice);

        for (const business of businesses) {
            const customers = businessCustomers[business.id];

            for (let i = 0; i < 5; i++) {
                const invoice = await invoiceFactory.make();
                invoice.business = business;
                invoice.businessId = business.id;
                invoice.customer = customers[Math.floor(Math.random() * customers.length)];
                invoice.customerId = invoice.customer.id;
                await dataSource.getRepository(Invoice).save(invoice);
            }
        }
        console.log('Created invoices');

        console.log('All seeding completed successfully!');
    }
}