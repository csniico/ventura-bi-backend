import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerIdToAppointments1769849703423
  implements MigrationInterface
{
  name = 'AddCustomerIdToAppointments1769849703423';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment" ADD "customerId" uuid`);
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status_enum" AS ENUM('scheduled', 'completed', 'canceled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "status" "public"."appointment_status_enum" NOT NULL DEFAULT 'scheduled'`,
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
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD CONSTRAINT "FK_c048c6004b69354f46183f93a85" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP CONSTRAINT "FK_c048c6004b69354f46183f93a85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "getfundRate" SET DEFAULT 0.025`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "nhilRate" SET DEFAULT 0.025`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "vatRate" SET DEFAULT 0.15`,
    );
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP COLUMN "customerId"`,
    );
  }
}
