import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDbStructure1722179653907 implements MigrationInterface {
  name = 'InitialDbStructure1722179653907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "department" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "capital" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_471da4b90e96c1ebe0af221e07b" UNIQUE ("name"), CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "facility" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "is_enabled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "icon_id" uuid, CONSTRAINT "UQ_1c8150565c89deac41a13e48d5c" UNIQUE ("slug"), CONSTRAINT "PK_07c6c82781d105a680b5c265be6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "app_icon" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b4512505727a2bf0994a410556c" UNIQUE ("slug"), CONSTRAINT "PK_6638d44dae9d9a910225cfc20fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "is_enabled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "icon_id" uuid, CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."image_resource_provider_enum" AS ENUM('cloudinary', 'aws', 'google')`,
    );
    await queryRunner.query(
      `CREATE TABLE "image_resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text NOT NULL, "file_name" text, "description" text, "description_en" text, "public_id" text, "width" integer, "height" integer, "format" text, "resource_type" text, "provider" "public"."image_resource_provider_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e91b9eb58a096638369851bf2a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "language" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7df7d1e250ea2a416f078a631fb" UNIQUE ("name"), CONSTRAINT "UQ_465b3173cdddf0ac2d3fe73a33c" UNIQUE ("code"), CONSTRAINT "PK_cc0a99e710eb3733f6fb42b1d4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "town_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fundation" date, "history" text, "culture" text, "economic" text, "altitude" smallint, "postal_code" text, "calling_code" text, "temperature" smallint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "REL_53ed4a2b69532c8c630a22ac99" UNIQUE ("town_id"), CONSTRAINT "PK_dde075975eb3696220bf9f07303" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "town_festivity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "REL_68ac172920729760d5c800eade" UNIQUE ("town_id"), CONSTRAINT "PK_91f9db439059d9dc1a47049bbc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "place_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "place_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_321b2db7828123af67c2afc42f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "place" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text NOT NULL, "difficulty_level" smallint NOT NULL DEFAULT '1', "rating" smallint NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "location" geometry(Point,4326) NOT NULL, "urbar_center_distance" smallint NOT NULL DEFAULT '0', "google_maps_url" text, "history" text, "temperature" smallint, "max_depth" smallint, "altitude" smallint, "capacity" smallint, "min_age" smallint, "max_age" smallint, "how_to_get_there" text, "transport_reference" text, "local_transport_options" text, "arrival_reference" text, "recommendations" text, "how_to_dress" text, "restrictions" text, "observations" text, "state_db" boolean NOT NULL DEFAULT true, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "UQ_1443badb6c7af8994264958b4d3" UNIQUE ("slug"), CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_497f3216ef683acf6954bd6fb2" ON "place" USING GiST ("location") `);
    await queryRunner.query(
      `CREATE TABLE "town" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "url" text, "location" geometry(Point,4326), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "department_id" uuid, CONSTRAINT "UQ_9511a4e785196486335a4f688e2" UNIQUE ("name"), CONSTRAINT "PK_983b203100527a0c323c5e3b106" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_21a0c332038a4c1bc517b8ee5b" ON "town" USING GiST ("location") `);
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ip_address" character varying(45), "user_agent" text, "last_activity" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_c0d3e43ae2fc42f035d710dc44" ON "session" ("last_activity") `);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" text NOT NULL, "email" text NOT NULL, "password" text, "profile_photo" json, "email_verified_at" TIMESTAMP, "is_super_user" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "role_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "permissions" text array NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model_category" ("modelId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_19d6062c0a712b50b7fe2e592c0" PRIMARY KEY ("modelId", "categoryId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d1fb398d856212310bb32115a3" ON "model_category" ("modelId") `);
    await queryRunner.query(`CREATE INDEX "IDX_9688e27d500a9de76e4e96a78f" ON "model_category" ("categoryId") `);
    await queryRunner.query(
      `CREATE TABLE "model_facility" ("modelId" uuid NOT NULL, "facilityId" uuid NOT NULL, CONSTRAINT "PK_56ee0d1f7eefec6727d6c9287e2" PRIMARY KEY ("modelId", "facilityId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_dcf81bc92b7cdb6ce481065d93" ON "model_facility" ("modelId") `);
    await queryRunner.query(`CREATE INDEX "IDX_2ec34d050de3491c4542a54878" ON "model_facility" ("facilityId") `);
    await queryRunner.query(
      `CREATE TABLE "place_facility" ("placeId" uuid NOT NULL, "facilityId" uuid NOT NULL, CONSTRAINT "PK_05de4d0c65f341a319eca5dc18f" PRIMARY KEY ("placeId", "facilityId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_be5377f9c9e1b717f783376ac4" ON "place_facility" ("placeId") `);
    await queryRunner.query(`CREATE INDEX "IDX_d2d94b90b1b87b16c52e18d980" ON "place_facility" ("facilityId") `);
    await queryRunner.query(
      `CREATE TABLE "place_category" ("placeId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_43cd1d7bee9a02f09d9fd3cf592" PRIMARY KEY ("placeId", "categoryId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_77d9549751bab0cdec48e15631" ON "place_category" ("placeId") `);
    await queryRunner.query(`CREATE INDEX "IDX_632e9bf4461567d50d91607733" ON "place_category" ("categoryId") `);
    await queryRunner.query(
      `ALTER TABLE "facility" ADD CONSTRAINT "FK_61b0bcafa951a675aa0a7842402" FOREIGN KEY ("icon_id") REFERENCES "app_icon"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_4acc05cb7efa59a5018cdd76d39" FOREIGN KEY ("icon_id") REFERENCES "app_icon"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "town_info" ADD CONSTRAINT "FK_53ed4a2b69532c8c630a22ac997" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "town_festivity" ADD CONSTRAINT "FK_68ac172920729760d5c800eade3" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_image" ADD CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_image" ADD CONSTRAINT "FK_dfbc68191e4bd510f023d8bbe77" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place" ADD CONSTRAINT "FK_579d731c4d4dc7f0dccc33c6aa9" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "town" ADD CONSTRAINT "FK_b0e3889db051ff7334fcc6ec22d" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_category" ADD CONSTRAINT "FK_d1fb398d856212310bb32115a37" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_category" ADD CONSTRAINT "FK_9688e27d500a9de76e4e96a78f2" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_facility" ADD CONSTRAINT "FK_dcf81bc92b7cdb6ce481065d935" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_facility" ADD CONSTRAINT "FK_2ec34d050de3491c4542a54878c" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_facility" ADD CONSTRAINT "FK_be5377f9c9e1b717f783376ac49" FOREIGN KEY ("placeId") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_facility" ADD CONSTRAINT "FK_d2d94b90b1b87b16c52e18d980a" FOREIGN KEY ("facilityId") REFERENCES "facility"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_category" ADD CONSTRAINT "FK_77d9549751bab0cdec48e15631a" FOREIGN KEY ("placeId") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_category" ADD CONSTRAINT "FK_632e9bf4461567d50d91607733d" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_632e9bf4461567d50d91607733d"`);
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_77d9549751bab0cdec48e15631a"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_d2d94b90b1b87b16c52e18d980a"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_be5377f9c9e1b717f783376ac49"`);
    await queryRunner.query(`ALTER TABLE "model_facility" DROP CONSTRAINT "FK_2ec34d050de3491c4542a54878c"`);
    await queryRunner.query(`ALTER TABLE "model_facility" DROP CONSTRAINT "FK_dcf81bc92b7cdb6ce481065d935"`);
    await queryRunner.query(`ALTER TABLE "model_category" DROP CONSTRAINT "FK_9688e27d500a9de76e4e96a78f2"`);
    await queryRunner.query(`ALTER TABLE "model_category" DROP CONSTRAINT "FK_d1fb398d856212310bb32115a37"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
    await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
    await queryRunner.query(`ALTER TABLE "town" DROP CONSTRAINT "FK_b0e3889db051ff7334fcc6ec22d"`);
    await queryRunner.query(`ALTER TABLE "place" DROP CONSTRAINT "FK_579d731c4d4dc7f0dccc33c6aa9"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_dfbc68191e4bd510f023d8bbe77"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898"`);
    await queryRunner.query(`ALTER TABLE "town_festivity" DROP CONSTRAINT "FK_68ac172920729760d5c800eade3"`);
    await queryRunner.query(`ALTER TABLE "town_info" DROP CONSTRAINT "FK_53ed4a2b69532c8c630a22ac997"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_4acc05cb7efa59a5018cdd76d39"`);
    await queryRunner.query(`ALTER TABLE "facility" DROP CONSTRAINT "FK_61b0bcafa951a675aa0a7842402"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_632e9bf4461567d50d91607733"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77d9549751bab0cdec48e15631"`);
    await queryRunner.query(`DROP TABLE "place_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d2d94b90b1b87b16c52e18d980"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be5377f9c9e1b717f783376ac4"`);
    await queryRunner.query(`DROP TABLE "place_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2ec34d050de3491c4542a54878"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dcf81bc92b7cdb6ce481065d93"`);
    await queryRunner.query(`DROP TABLE "model_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9688e27d500a9de76e4e96a78f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1fb398d856212310bb32115a3"`);
    await queryRunner.query(`DROP TABLE "model_category"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d3e43ae2fc42f035d710dc44"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_21a0c332038a4c1bc517b8ee5b"`);
    await queryRunner.query(`DROP TABLE "town"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_497f3216ef683acf6954bd6fb2"`);
    await queryRunner.query(`DROP TABLE "place"`);
    await queryRunner.query(`DROP TABLE "place_image"`);
    await queryRunner.query(`DROP TABLE "town_festivity"`);
    await queryRunner.query(`DROP TABLE "town_info"`);
    await queryRunner.query(`DROP TABLE "language"`);
    await queryRunner.query(`DROP TABLE "image_resource"`);
    await queryRunner.query(`DROP TYPE "public"."image_resource_provider_enum"`);
    await queryRunner.query(`DROP TABLE "model"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "app_icon"`);
    await queryRunner.query(`DROP TABLE "facility"`);
    await queryRunner.query(`DROP TABLE "department"`);
  }
}
