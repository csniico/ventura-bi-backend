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
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    console.log('Seeding permissions...');
    const permissionRepository = dataSource.getRepository(Permission);

    const resources = [
      'user',
      'role',
      'business',
      'customer',
      'product',
      'order',
      'invoice',
      'appointment',
    ];
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
      {
        name: 'manager',
        description: 'Manager with business management access',
      },
      { name: 'editor', description: 'Editor with content management access' },
      { name: 'viewer', description: 'Viewer with read-only access' },
      { name: 'accountant', description: 'Accountant with financial access' },
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

    console.log('Seeding user...');
    const userFactory = factoryManager.get(User);
    const user = await userFactory.make();

    // Assign the admin role to the user
    user.roles = [roles.find((r) => r.name === 'admin')!];
    const savedUser = await dataSource.getRepository(User).save(user);
    console.log(`Created 1 user`);

    console.log('Seeding business...');
    const businessFactory = factoryManager.get(Business);
    const business = await businessFactory.make();
    business.owner = savedUser;
    business.ownerId = savedUser.id;
    const savedBusiness = await dataSource
      .getRepository(Business)
      .save(business);
    console.log(`Created 1 business`);

    console.log('Seeding customer...');
    const customerFactory = factoryManager.get(Customer);
    const customer = await customerFactory.make();
    customer.business = savedBusiness;
    customer.businessId = savedBusiness.id;
    const savedCustomer = await dataSource
      .getRepository(Customer)
      .save(customer);
    console.log(`Created 1 customer`);

    console.log('Seeding product...');
    const productFactory = factoryManager.get(Product);
    const product = await productFactory.make();
    product.business = savedBusiness;
    product.businessId = savedBusiness.id;
    const savedProduct = await dataSource.getRepository(Product).save(product);
    console.log(`Created 1 product`);

    console.log('Seeding appointment...');
    const appointmentFactory = factoryManager.get(Appointment);
    const appointment = await appointmentFactory.make();
    appointment.business = savedBusiness;
    appointment.businessId = savedBusiness.id;
    appointment.customer = savedCustomer;
    appointment.customerId = savedCustomer.id;
    appointment.organizer = savedUser;
    appointment.organizerId = savedUser.id;
    await dataSource.getRepository(Appointment).save(appointment);
    console.log('Created 1 appointment');

    console.log('Seeding order...');
    const orderFactory = factoryManager.get(Order);
    const orderItemFactory = factoryManager.get(OrderItem);

    const order = await orderFactory.make();
    order.business = savedBusiness;
    order.businessId = savedBusiness.id;
    order.customer = savedCustomer;
    order.customerId = savedCustomer.id;
    const savedOrder = await dataSource.getRepository(Order).save(order);

    // Create one order item
    const orderItem = await orderItemFactory.make();
    orderItem.order = savedOrder;
    orderItem.orderId = savedOrder.id;
    orderItem.product = savedProduct;
    orderItem.productId = savedProduct.id;
    await dataSource.getRepository(OrderItem).save(orderItem);

    console.log('Created 1 order with 1 item');

    console.log('Seeding invoice...');
    const invoiceFactory = factoryManager.get(Invoice);

    const invoice = await invoiceFactory.make();
    invoice.business = savedBusiness;
    invoice.businessId = savedBusiness.id;
    invoice.customer = savedCustomer;
    invoice.customerId = savedCustomer.id;
    await dataSource.getRepository(Invoice).save(invoice);

    console.log('Created 1 invoice');

    console.log('All seeding completed successfully!');
  }
}
