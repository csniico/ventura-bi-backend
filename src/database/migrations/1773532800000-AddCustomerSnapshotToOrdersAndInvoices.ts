import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerSnapshotToOrdersAndInvoices1773532800000
  implements MigrationInterface
{
  name = 'AddCustomerSnapshotToOrdersAndInvoices1773532800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add customer snapshot columns to order table
    await queryRunner.query(
      `ALTER TABLE "order" ADD "customerName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "customerEmail" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "customerPhone" character varying`,
    );

    // Add customer snapshot columns to invoices table
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "customerName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "customerEmail" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "customerPhone" character varying`,
    );

    // Make customerId nullable on invoices (was NOT NULL before)
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "customerId" DROP NOT NULL`,
    );

    // Drop FK constraint from order.customerId -> customer
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'order'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'customerId';
        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "order" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);

    // Drop FK constraint from invoices.customerId -> customer
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'invoices'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'customerId';
        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "invoices" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add FK constraints
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_order_customer" FOREIGN KEY ("customerId") REFERENCES "customer"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_customer" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Restore NOT NULL on invoices.customerId
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "customerId" SET NOT NULL`,
    );

    // Drop snapshot columns from invoices
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN "customerPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN "customerEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN "customerName"`,
    );

    // Drop snapshot columns from order
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerPhone"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerEmail"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerName"`);
  }
}
