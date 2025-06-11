import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscribeTable1721235000000 implements MigrationInterface {
  name = "CreateSubscribeTable1721235000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "subscribe" (
                "id" SERIAL NOT NULL,
                "email" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_subscribe_email" UNIQUE ("email"),
                CONSTRAINT "PK_subscribe_id" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscribe"`);
  }
}
