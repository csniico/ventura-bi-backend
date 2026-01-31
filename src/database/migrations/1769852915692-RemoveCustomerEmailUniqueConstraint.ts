import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCustomerEmailUniqueConstraint1769852915692
  implements MigrationInterface
{
  name = 'RemoveCustomerEmailUniqueConstraint1769852915692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "vatRate" SET DEFAULT '0.15'`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "nhilRate" SET DEFAULT '0.025'`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "getfundRate" SET DEFAULT '0.025'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "getfundRate" SET DEFAULT 0.025`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "nhilRate" SET DEFAULT 0.025`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "vatRate" SET DEFAULT 0.15`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb" UNIQUE ("email")`,
    );
  }
}
