import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditTable1771266586124 implements MigrationInterface {
  name = 'CreateAuditTable1771266586124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audits_action_enum" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'RESTORE', 'ARCHIVE', 'SEND', 'APPROVE', 'REJECT', 'CANCEL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audits_entity_enum" AS ENUM('USER', 'BUSINESS', 'APPOINTMENT', 'CUSTOMER', 'ORDER', 'ORDER_ITEM', 'INVOICE', 'PRODUCT', 'SERVICE', 'MAIL', 'RESOURCE', 'STORAGE', 'AUTH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."audits_action_enum" NOT NULL, "entity" "public"."audits_entity_enum" NOT NULL, "entityId" uuid, "userId" uuid, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b2d7a2089999197dc7024820f28" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(`DROP TABLE "audits"`);
    await queryRunner.query(`DROP TYPE "public"."audits_entity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."audits_action_enum"`);
  }
}
