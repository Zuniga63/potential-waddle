import { MigrationInterface, QueryRunner } from "typeorm";

export class DefaultMigrationName1767840669651 implements MigrationInterface {
    name = 'DefaultMigrationName1767840669651'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear la nueva tabla de relación ManyToMany
        await queryRunner.query(`CREATE TABLE "guide_town" ("guide_id" uuid NOT NULL, "town_id" uuid NOT NULL, CONSTRAINT "PK_064470121573572e8c1b7a904ff" PRIMARY KEY ("guide_id", "town_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a8c0dbc17ab28e8a6148f361a2" ON "guide_town" ("guide_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_82b71a9861142b24f157049c12" ON "guide_town" ("town_id") `);

        // 2. Migrar los datos existentes de guide.town_id a guide_town
        await queryRunner.query(`INSERT INTO "guide_town" ("guide_id", "town_id") SELECT "id", "town_id" FROM "guide" WHERE "town_id" IS NOT NULL`);

        // 3. Eliminar la constraint de foreign key antigua
        await queryRunner.query(`ALTER TABLE "guide" DROP CONSTRAINT "FK_958aea0517e74c04c4ad4206be3"`);

        // 4. Eliminar la columna town_id
        await queryRunner.query(`ALTER TABLE "guide" DROP COLUMN "town_id"`);

        // 5. Añadir las constraints de foreign key a la nueva tabla
        await queryRunner.query(`ALTER TABLE "guide_town" ADD CONSTRAINT "FK_a8c0dbc17ab28e8a6148f361a20" FOREIGN KEY ("guide_id") REFERENCES "guide"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "guide_town" ADD CONSTRAINT "FK_82b71a9861142b24f157049c124" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guide_town" DROP CONSTRAINT "FK_82b71a9861142b24f157049c124"`);
        await queryRunner.query(`ALTER TABLE "guide_town" DROP CONSTRAINT "FK_a8c0dbc17ab28e8a6148f361a20"`);
        await queryRunner.query(`ALTER TABLE "guide" ADD "town_id" uuid`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82b71a9861142b24f157049c12"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8c0dbc17ab28e8a6148f361a2"`);
        await queryRunner.query(`DROP TABLE "guide_town"`);
        await queryRunner.query(`ALTER TABLE "guide" ADD CONSTRAINT "FK_958aea0517e74c04c4ad4206be3" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
