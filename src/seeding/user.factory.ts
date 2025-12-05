import { User } from 'src/user/entities/user.entity';
import { setSeederFactory } from 'typeorm-extension';
import * as bcrypt from 'bcrypt';

export const UserFactory = setSeederFactory(User, async (faker) => {
  const user = new User();
  const firstNames = [
    'John',
    'Jane',
    'Mike',
    'Sarah',
    'David',
    'Emma',
    'Chris',
    'Lisa',
    'Tom',
    'Anna',
    'James',
    'Mary',
    'Robert',
    'Patricia',
    'Michael',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
  ];

  const firstName = faker.helpers.arrayElement(firstNames);
  const lastName = faker.helpers.arrayElement(lastNames);

  user.firstName = firstName;
  user.lastName = lastName;
  user.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${faker.string.alphanumeric(6).toLowerCase()}@example.com`;
  user.password = await bcrypt.hash('securePassword!23', 10);
  user.avatarUrl = faker.image.avatar();
  if (faker.datatype.boolean({ probability: 0.3 })) {
    user.googleId = faker.string.alphanumeric(21);
  }
  user.isActive = faker.datatype.boolean({ probability: 0.95 });
  user.isSystem = false;

  return user;
});
