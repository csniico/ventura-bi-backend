import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInvoiceModule1768647692686 implements MigrationInterface {
  name = 'UpdateInvoiceModule1768647692686';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_invoicetype_enum" AS ENUM('STANDARD', 'PROFORMA', 'RECIEPT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "invoiceType" "public"."invoices_invoicetype_enum" NOT NULL DEFAULT 'STANDARD'`,
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
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "invoiceType"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_invoicetype_enum"`);
  }
}
