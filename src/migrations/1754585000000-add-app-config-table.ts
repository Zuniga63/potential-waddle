import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppConfigTable1754585000000 implements MigrationInterface {
  name = 'AddAppConfigTable1754585000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "app_config" (
        "id" SERIAL NOT NULL, 
        "key" character varying NOT NULL, 
        "value" character varying NOT NULL, 
        "description" character varying, 
        "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
        CONSTRAINT "UQ_app_config_key" UNIQUE ("key"), 
        CONSTRAINT "PK_app_config" PRIMARY KEY ("id")
      )
    `);

    // Insertar configuración inicial para Rafa
    await queryRunner.query(`
      INSERT INTO "app_config" ("key", "value", "description") 
      VALUES ('rafa_mode', 'basic', 'Modo de funcionamiento de Rafa: basic (chat clásico) o superIA (SuperRafa)')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "app_config"`);
  }
}
