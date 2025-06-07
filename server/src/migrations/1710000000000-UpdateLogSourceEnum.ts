import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLogSourceEnum1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update existing records to use the new format
    await queryRunner.query(`
            UPDATE log 
            SET source = REPLACE(source, '_', '-')
            WHERE source LIKE '%_%'
        `);

    // Then, drop and recreate the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS log_source_enum CASCADE`);
    await queryRunner.query(`
            CREATE TYPE log_source_enum AS ENUM (
                'syllabus-queue',
                'syllabus-processor',
                'syllabus-upload',
                'quiz-generator',
                'user-action',
                'system'
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the enum type to the old format
    await queryRunner.query(`DROP TYPE IF EXISTS log_source_enum CASCADE`);
    await queryRunner.query(`
            CREATE TYPE log_source_enum AS ENUM (
                'syllabus_queue',
                'syllabus_processor',
                'syllabus_upload',
                'quiz_generator',
                'notification',
                'topic_parser'
            )
        `);

    // Revert the data format
    await queryRunner.query(`
            UPDATE log 
            SET source = REPLACE(source, '-', '_')
            WHERE source LIKE '%-%'
        `);
  }
}
