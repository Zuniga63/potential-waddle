import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntitySlugToPromotions1753000000000 implements MigrationInterface {
  name = 'AddEntitySlugToPromotions1753000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "promotion" ADD "entity_slug" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "promotion" DROP COLUMN "entity_slug"`);
  }
} 