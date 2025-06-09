import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCurrentAffairs1710000000002 implements MigrationInterface {
  name = "CreateCurrentAffairs1710000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "current_affair" (
                "id" SERIAL NOT NULL,
                "headline" character varying NOT NULL,
                "summary" text NOT NULL,
                "keywords" text NOT NULL,
                "relatedTopics" text NOT NULL,
                "sourceUrl" character varying,
                "publishedDate" TIMESTAMP,
                "filePath" character varying,
                "isPublished" boolean NOT NULL DEFAULT false,
                "created_by" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_current_affair" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "current_affair"
            ADD CONSTRAINT "FK_current_affair_user"
            FOREIGN KEY ("created_by")
            REFERENCES "user"("id")
            ON DELETE SET NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "current_affair" DROP CONSTRAINT "FK_current_affair_user"`
    );
    await queryRunner.query(`DROP TABLE "current_affair"`);
  }
}
