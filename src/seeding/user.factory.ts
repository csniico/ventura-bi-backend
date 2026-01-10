import { User } from 'src/user/entities/user.entity';
import { setSeederFactory } from 'typeorm-extension';
import * as argon2 from 'argon2';

export const UserFactory = setSeederFactory(User, async (faker) => {
  const user = new User();
  // const firstNames = [
  //   'John',
  //   'Jane',
  //   'Mike',
  //   'Sarah',
  //   'David',
  //   'Emma',
  //   'Chris',
  //   'Lisa',
  //   'Tom',
  //   'Anna',
  //   'James',
  //   'Mary',
  //   'Robert',
  //   'Patricia',
  //   'Michael',
  // ];
  // const lastNames = [
  //   'Smith',
  //   'Johnson',
  //   'Williams',
  //   'Brown',
  //   'Jones',
  //   'Garcia',
  //   'Miller',
  //   'Davis',
  //   'Rodriguez',
  //   'Martinez',
  //   'Hernandez',
  //   'Lopez',
  //   'Gonzalez',
  //   'Wilson',
  //   'Anderson',
  // ];

  // const firstName = faker.helpers.arrayElement(firstNames);
  // const lastName = faker.helpers.arrayElement(lastNames);

  user.firstName = 'Roger';
  user.lastName = 'Ventura';
  user.email = `user@ventura.com`;
  user.password = await argon2.hash('securePassword!234');
  user.avatarUrl = faker.image.avatar();
  user.isActive = faker.datatype.boolean({ probability: 0.95 });
  user.isSystem = false;

  return user;
});
