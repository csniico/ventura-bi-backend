import { DataSource, DataSourceOptions } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';
import { UserFactory } from './user.factory';
import { MainSeeder } from './main.seeder';

// Load environment variables
config();

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT!) || 5432,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl:
    process.env.PGSSLMODE === 'require'
      ? {
          rejectUnauthorized: false,
        }
      : false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  seeds: [MainSeeder],
  factories: [UserFactory],
};

const dataSource = new DataSource(options);

dataSource
  .initialize()
  .then(async () => {
    // Drop and recreate tables
    // Note to self::: DO NOT do this in production.
    // as a matter of fact...DO NOT do this AT ALL !!!

    // TODO: add a flag to control the execution of this code below.
    // it is the most dangerous piece of code in this whole repository
    // use it carefully.
    await dataSource.synchronize(true);
    // when the argument passed to the .synchronize is
    // 1. true:: it will drop all tables and recreate them ( essentially all data is lost )
    // 2. false:: it will only create missing tables and fields without touching existing data

    await runSeeders(dataSource);

    console.log('Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });
