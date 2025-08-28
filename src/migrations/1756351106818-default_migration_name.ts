import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPricesJsonToPublicEvents1756351106818 implements MigrationInterface {
    name = 'AddPricesJsonToPublicEvents1756351106818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar la nueva columna de precios JSON
        await queryRunner.query(`ALTER TABLE "public_event" ADD COLUMN "prices" JSONB DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover la columna de precios JSON
        await queryRunner.query(`ALTER TABLE "public_event" DROP COLUMN "prices"`);
    }
}
