import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPageTypeToWhatsappClicks1759344326223 implements MigrationInterface {
    name = 'AddPageTypeToWhatsappClicks1759344326223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_click" ADD "page_type" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_click" DROP COLUMN "page_type"`);
    }

}
