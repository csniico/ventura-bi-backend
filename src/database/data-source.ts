import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import 'tsconfig-paths/register';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
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
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // NEVER true in production
});
