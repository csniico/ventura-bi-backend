import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToOrdersAndInvoices1772653592757
  implements MigrationInterface
{
  name = 'AddSoftDeleteToOrdersAndInvoices1772653592757';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "order" ADD "deletedAt" TIMESTAMP`);
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
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "deletedAt"`);
  }
}
