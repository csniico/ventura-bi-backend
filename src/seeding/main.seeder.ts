import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { User } from 'src/user/entities/user.entity';

export class MainSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    console.log('Seeding user...');
    const userFactory = factoryManager.get(User);
    const user = await userFactory.make();

    // Assign the admin role to the
    // user.roles = [roles.find((r) => r.name === 'admin')!];
    await dataSource.getRepository(User).save(user);
    console.log(`Created 1 user`);

    console.log('All seeding completed successfully!');
  }
}
