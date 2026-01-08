import { MigrationInterface, QueryRunner } from "typeorm";

export class DefaultMigrationName1767674794180 implements MigrationInterface {
    name = 'DefaultMigrationName1767674794180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rafa_leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" uuid NOT NULL, "contact_phone" character varying(20), "contact_email" character varying(100), "notes" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "state_snapshot" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_044afcbd974ef100982318679fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rafa_conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "state" jsonb NOT NULL DEFAULT '{}', "session_id" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf87d9374cdf0e035e630e6a62a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rafa_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "role" character varying(20) NOT NULL, "content" text NOT NULL, "intent" character varying(50), "confidence" numeric(3,2), "extracted_data" jsonb, "tool_used" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b6beddf86d55477c8c6fc2d086a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rafa_leads" ADD CONSTRAINT "FK_a3cae2e20832eb9369f69a9c3b5" FOREIGN KEY ("conversation_id") REFERENCES "rafa_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rafa_conversations" ADD CONSTRAINT "FK_b9daebaedd09a52677719acbf5c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rafa_messages" ADD CONSTRAINT "FK_295b155c1da79a2f93945708c79" FOREIGN KEY ("conversation_id") REFERENCES "rafa_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rafa_messages" DROP CONSTRAINT "FK_295b155c1da79a2f93945708c79"`);
        await queryRunner.query(`ALTER TABLE "rafa_conversations" DROP CONSTRAINT "FK_b9daebaedd09a52677719acbf5c"`);
        await queryRunner.query(`ALTER TABLE "rafa_leads" DROP CONSTRAINT "FK_a3cae2e20832eb9369f69a9c3b5"`);
        await queryRunner.query(`DROP TABLE "rafa_messages"`);
        await queryRunner.query(`DROP TABLE "rafa_conversations"`);
        await queryRunner.query(`DROP TABLE "rafa_leads"`);
    }

}
