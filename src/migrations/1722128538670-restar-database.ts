import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestarDatabase1722128538670 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SET session_replication_role = replica;');
    // Recupero todas la tablas de la base de datos
    const tables = await queryRunner.query(
      `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE';`,
    );

    // Truncar todas las tablas y reiniciar las secuencias
    for (const { table_name } of tables) {
      await queryRunner.query(`TRUNCATE TABLE "${table_name}" RESTART IDENTITY CASCADE;`);
    }

    await queryRunner.query(`DROP TABLE "place_image"`);
    await queryRunner.query(`DROP TABLE "place_category"`);
    await queryRunner.query(`DROP TABLE "image_resource"`);
    await queryRunner.query(`DROP TYPE "public"."image_resource_provider_enum"`);
    await queryRunner.query(`DROP TABLE "language"`);
    await queryRunner.query(`DROP TABLE "place_facility"`);
    await queryRunner.query(`DROP TABLE "place"`);
    await queryRunner.query(`DROP TABLE "model_facility"`);
    await queryRunner.query(`DROP TABLE "model_category"`);
    await queryRunner.query(`DROP TABLE "model"`);
    await queryRunner.query(`DROP TABLE "facility"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "town"`);
    await queryRunner.query(`DROP TABLE "municipality"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query('SET session_replication_role = DEFAULT;');
  }

  public async down(): Promise<void> {}
}
