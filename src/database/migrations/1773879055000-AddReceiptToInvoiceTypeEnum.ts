import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceiptToInvoiceTypeEnum1773879055000
  implements MigrationInterface
{
  name = 'AddReceiptToInvoiceTypeEnum1773879055000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL requires ADD VALUE to run outside a transaction block.
    // TypeORM wraps migrations in a transaction by default, so we must
    // commit the current transaction first, add the value, then restart.
    await queryRunner.query(`COMMIT`);
    await queryRunner.query(
      `ALTER TYPE "public"."invoices_invoicetype_enum" ADD VALUE IF NOT EXISTS 'RECEIPT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // To roll back: recreate the enum without RECEIPT and update the column.
    await queryRunner.query(`COMMIT`);
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "invoiceType" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "invoiceType" TYPE VARCHAR(50)`,
    );
    await queryRunner.query(
      `UPDATE "invoices" SET "invoiceType" = 'STANDARD' WHERE "invoiceType" = 'RECEIPT'`,
    );
    await queryRunner.query(`DROP TYPE "public"."invoices_invoicetype_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_invoicetype_enum" AS ENUM('STANDARD', 'PROFORMA')`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "invoiceType" TYPE "public"."invoices_invoicetype_enum" USING "invoiceType"::"public"."invoices_invoicetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "invoiceType" SET DEFAULT 'STANDARD'`,
    );
  }
}
