import { Customer } from "src/customer/entities/customer.entity";
import { setSeederFactory } from "typeorm-extension";

export const CustomerFactory = setSeederFactory(Customer, (faker) => {
    const customer = new Customer();
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Tom', 'Anna', 'James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'Richard', 'Barbara'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin'];

    customer.firstName = faker.helpers.arrayElement(firstNames);
    customer.lastName = faker.helpers.arrayElement(lastNames);
    customer.email = `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}.${faker.string.alphanumeric(6).toLowerCase()}@example.com`;
    customer.phone = `+1-${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
    customer.avatar = faker.image.avatar();
    customer.address = faker.location.streetAddress();
    customer.city = faker.location.city();
    customer.state = faker.location.state();
    customer.country = faker.location.country();
    customer.zipCode = faker.location.zipCode();
    customer.dateOfBirth = faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
    customer.notes = `Customer notes: Preferred contact is ${faker.helpers.arrayElement(['email', 'phone', 'SMS'])}. Account created ${faker.date.past().toLocaleDateString()}.`;
    customer.preferences = {
        newsletter: faker.datatype.boolean(),
        smsNotifications: faker.datatype.boolean(),
        emailNotifications: faker.datatype.boolean(),
        preferredContactMethod: faker.helpers.arrayElement(['email', 'phone', 'sms'])
    };
    customer.tags = faker.helpers.arrayElements(
        ['vip', 'regular', 'new', 'returning', 'high-value', 'at-risk'],
        { min: 1, max: 3 }
    );
    customer.isActive = faker.datatype.boolean({ probability: 0.9 });

    return customer;
});