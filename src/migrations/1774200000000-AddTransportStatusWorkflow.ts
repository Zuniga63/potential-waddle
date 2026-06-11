import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Transport entity declares `status`, `submitted_at` y `rejection_reason` pero
 * la tabla en BD nunca tuvo esas columnas (sin migración previa). Esta agrega
 * las columnas para que los GET /users/:id/transport dejen de fallar con
 * "column transport.status does not exist".
 *
 * Convención: usamos `text` con default 'draft' — matching la decoración de la
 * entity (`@Column('text', { name: 'status', default: 'draft' })`). No se crea
 * un enum dedicado porque la entity no lo declara así (a diferencia de
 * experience/restaurant/commerce/guide que sí usan tipos enum).
 *
 * Backfill: los transports existentes pasan a 'published' para que sigan
 * apareciendo en listados públicos una vez la lectura pública filtre por status.
 */
export class AddTransportStatusWorkflow1774200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transport" ADD COLUMN "status" text NOT NULL DEFAULT 'draft'`);
    await queryRunner.query(`UPDATE "transport" SET "status" = 'published' WHERE "status" = 'draft'`);
    await queryRunner.query(`ALTER TABLE "transport" ADD COLUMN "submitted_at" timestamp`);
    await queryRunner.query(`ALTER TABLE "transport" ADD COLUMN "rejection_reason" text`);

    await queryRunner.query(`CREATE INDEX "idx_transport_status" ON "transport" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_transport_status"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "submitted_at"`);
    await queryRunner.query(`ALTER TABLE "transport" DROP COLUMN "status"`);
  }
}
