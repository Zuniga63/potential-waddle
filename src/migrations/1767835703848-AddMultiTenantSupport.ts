import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultiTenantSupport1767835703848 implements MigrationInterface {
    name = 'AddMultiTenantSupport1767835703848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_towns" ("usersId" uuid NOT NULL, "townId" uuid NOT NULL, CONSTRAINT "PK_74f7dfefca62e21960df0e34ec2" PRIMARY KEY ("usersId", "townId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_db95579d35ccde77992250ab0f" ON "user_towns" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6777bfe6a5febf097021ca53de" ON "user_towns" ("townId") `);
        await queryRunner.query(`ALTER TABLE "town" ADD "slug" text`);
        await queryRunner.query(`ALTER TABLE "town" ADD CONSTRAINT "UQ_3738981f385f6d7d4b3e7ae42f7" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "user_towns" ADD CONSTRAINT "FK_db95579d35ccde77992250ab0fa" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_towns" ADD CONSTRAINT "FK_6777bfe6a5febf097021ca53de8" FOREIGN KEY ("townId") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_towns" DROP CONSTRAINT "FK_6777bfe6a5febf097021ca53de8"`);
        await queryRunner.query(`ALTER TABLE "user_towns" DROP CONSTRAINT "FK_db95579d35ccde77992250ab0fa"`);
        await queryRunner.query(`ALTER TABLE "town" DROP CONSTRAINT "UQ_3738981f385f6d7d4b3e7ae42f7"`);
        await queryRunner.query(`ALTER TABLE "town" DROP COLUMN "slug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6777bfe6a5febf097021ca53de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db95579d35ccde77992250ab0f"`);
        await queryRunner.query(`DROP TABLE "user_towns"`);
    }

}
