import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAdminToUser1710000000001 implements MigrationInterface {
  name = "AddIsAdminToUser1710000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "isAdmin" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isAdmin"`);
  }
}
