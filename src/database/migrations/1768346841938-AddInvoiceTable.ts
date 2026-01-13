import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceTable1768346841938 implements MigrationInterface {
  name = 'AddInvoiceTable1768346841938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_paymentmethod_enum" AS ENUM('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'CHEQUE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying NOT NULL, "businessId" uuid NOT NULL, "customerId" uuid NOT NULL, "subtotal" numeric(10,2) NOT NULL, "vatRate" numeric(5,4) NOT NULL DEFAULT '0.15', "vatAmount" numeric(10,2) NOT NULL, "nhilRate" numeric(5,4) NOT NULL DEFAULT '0.025', "nhilAmount" numeric(10,2) NOT NULL, "getfundRate" numeric(5,4) NOT NULL DEFAULT '0.025', "getfundAmount" numeric(10,2) NOT NULL, "totalTax" numeric(10,2) NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "amountPaid" numeric(10,2) NOT NULL DEFAULT '0', "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'DRAFT', "paymentMethod" "public"."invoices_paymentmethod_enum", "paymentDate" TIMESTAMP, "issueDate" TIMESTAMP, "dueDate" TIMESTAMP, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "order" ADD "invoiceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_68a367d17c787b9d2925987a4fa" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_1df049f8943c6be0c1115541efb" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_7f744b8c2bdab4a97c1d6306b72" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_124456e637cca7a415897dce659" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_a73f2bf30b1471eeeaafafd425f" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_a73f2bf30b1471eeeaafafd425f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_124456e637cca7a415897dce659"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_7f744b8c2bdab4a97c1d6306b72"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_1df049f8943c6be0c1115541efb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_68a367d17c787b9d2925987a4fa"`,
    );
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "invoiceId"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_paymentmethod_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
  }
}
