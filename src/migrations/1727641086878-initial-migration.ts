import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1727641086878 implements MigrationInterface {
  name = 'InitialMigration1727641086878';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // * ROLE TABLE
    await queryRunner.query(
      `CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "permissions" text array NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );

    // * SESSION TABLE
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ip_address" character varying(45), "user_agent" text, "last_activity" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_c0d3e43ae2fc42f035d710dc44" ON "session" ("last_activity") `);

    // * TOWN INFO TABLE
    await queryRunner.query(
      `CREATE TABLE "town_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fundation" date, "history" text, "culture" text, "economic" text, "altitude" smallint, "postal_code" text, "calling_code" text, "temperature" smallint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "REL_53ed4a2b69532c8c630a22ac99" UNIQUE ("town_id"), CONSTRAINT "PK_dde075975eb3696220bf9f07303" PRIMARY KEY ("id"))`,
    );

    // * DEPARTMENT TABLE
    await queryRunner.query(
      `CREATE TABLE "department" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "capital" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`,
    );

    // * TOWN FESTIVITY TABLE
    await queryRunner.query(
      `CREATE TABLE "town_festivity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "REL_68ac172920729760d5c800eade" UNIQUE ("town_id"), CONSTRAINT "PK_91f9db439059d9dc1a47049bbc8" PRIMARY KEY ("id"))`,
    );

    // * LODGING IMAGE TABLE
    await queryRunner.query(
      `CREATE TABLE "lodging_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "lodging_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_6b81eb63e980fbc9ad23752a82e" PRIMARY KEY ("id"))`,
    );

    // * LODGING TABLE
    await queryRunner.query(
      `CREATE TABLE "lodging" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "points" smallint NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "rating" smallint NOT NULL DEFAULT '0', "room_types" text array NOT NULL DEFAULT '{}', "room_count" smallint NOT NULL DEFAULT '0', "lowest_price" numeric(10,2), "highest_price" numeric(10,2), "address" text, "phone_numbers" text array DEFAULT '{}', "email" text, "website" text, "facebook" text, "instagram" text, "whatsapp_numbers" text array DEFAULT '{}', "opening_hours" text array, "spoken_languages" text array DEFAULT '{}', "location" geometry(Point,4326) NOT NULL, "google_maps_url" text, "urban_center_distance" smallint, "how_to_get_there" text, "arrival_reference" text, "is_public" boolean NOT NULL DEFAULT true, "state_db" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "UQ_bf76d81e7fbbc30ab876e960351" UNIQUE ("slug"), CONSTRAINT "PK_0d532e3ff6fc6f87e708d0e6216" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_efb0417aefc5c66891199db7f3" ON "lodging" USING GiST ("location") `);

    // * EXPERIENCE IMAGE TABLE
    await queryRunner.query(
      `CREATE TABLE "experience_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL DEFAULT '0', "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "experience_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_b5ba44c4f6738fbe2bede03f76c" PRIMARY KEY ("id"))`,
    );

    // * EXPERIENCE TABLE
    await queryRunner.query(
      `CREATE TABLE "experience" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text NOT NULL, "slug" text NOT NULL, "description" text NOT NULL, "difficulty_level" smallint NOT NULL DEFAULT '1', "price" numeric(10,2) NOT NULL, "departure_description" text, "departure_location" geometry(Point,4326) NOT NULL, "arrival_description" text, "arrival_location" geometry(Point,4326) NOT NULL, "travel_time" integer, "total_distance" integer, "rating" double precision NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "reviews_count" integer NOT NULL DEFAULT '0', "min_age" smallint, "max_age" smallint, "min_participants" smallint, "max_participants" smallint, "recommendations" text, "how_to_dress" text, "restrictions" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "UQ_46ee360a356c8dbd9a10176117f" UNIQUE ("slug"), CONSTRAINT "PK_5e8d5a534100e1b17ee2efa429a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b800b3c7fb310c5e709d0db33c" ON "experience" USING GiST ("departure_location") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca6bceb620a621ee97b4fdfaa1" ON "experience" USING GiST ("arrival_location") `,
    );

    // * RESTAURANT IMAGE TABLE
    await queryRunner.query(
      `CREATE TABLE "restaurant_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL DEFAULT '0', "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "restaurant_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_5040fdcfbdf7ed485c367e79c44" PRIMARY KEY ("id"))`,
    );

    // * RESTAURANT TABLE
    await queryRunner.query(
      `CREATE TABLE "restaurant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "rating" double precision NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "spoken_languages" text array, "address" text, "phone_numbers" text array, "whatsapp_numbers" text array NOT NULL DEFAULT '{}', "opening_hours" text array, "email" text, "website" text, "instagram" text, "facebook" text, "lowest_price" numeric(10,2), "higher_price" numeric(10,2), "location" geometry(Point,4326) NOT NULL, "urban_center_distance" integer, "google_maps_url" text, "how_to_get_there" text, "town_zone" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, "place_id" uuid, CONSTRAINT "UQ_cb7f1c337dcb0595ba6d44265f6" UNIQUE ("slug"), CONSTRAINT "PK_649e250d8b8165cb406d99aa30f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a4e247203bbc0618c88786121c" ON "restaurant" USING GiST ("location") `);

    // * TOWN TABLE
    await queryRunner.query(
      `CREATE TABLE "town" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "url" text, "location" geometry(Point,4326), "is_enable" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "department_id" uuid, CONSTRAINT "PK_983b203100527a0c323c5e3b106" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_21a0c332038a4c1bc517b8ee5b" ON "town" USING GiST ("location") `);

    // * PLACE IMAGE TABLE
    await queryRunner.query(
      `CREATE TABLE "place_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" smallint NOT NULL, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "place_id" uuid, "image_resource_id" uuid, CONSTRAINT "PK_321b2db7828123af67c2afc42f0" PRIMARY KEY ("id"))`,
    );

    // * PLACE TABLE
    await queryRunner.query(
      `CREATE TABLE "place" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text NOT NULL, "difficulty_level" smallint NOT NULL DEFAULT '1', "rating" double precision NOT NULL DEFAULT '0', "points" smallint NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "location" geometry(Point,4326) NOT NULL, "urbar_center_distance" smallint NOT NULL DEFAULT '0', "google_maps_url" text, "history" text, "temperature" smallint, "max_depth" smallint, "altitude" smallint, "capacity" smallint, "min_age" smallint, "max_age" smallint, "how_to_get_there" text, "transport_reference" text, "local_transport_options" text, "arrival_reference" text, "recommendations" text, "how_to_dress" text, "restrictions" text, "observations" text, "state_db" boolean NOT NULL DEFAULT true, "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "town_id" uuid, CONSTRAINT "UQ_1443badb6c7af8994264958b4d3" UNIQUE ("slug"), CONSTRAINT "PK_96ab91d43aa89c5de1b59ee7cca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_497f3216ef683acf6954bd6fb2" ON "place" USING GiST ("location") `);

    // * FACILITY TABLE
    await queryRunner.query(
      `CREATE TABLE "facility" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "is_enabled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "icon_id" uuid, CONSTRAINT "UQ_1c8150565c89deac41a13e48d5c" UNIQUE ("slug"), CONSTRAINT "PK_07c6c82781d105a680b5c265be6" PRIMARY KEY ("id"))`,
    );

    // * APP ICON TABLE
    await queryRunner.query(
      `CREATE TABLE "app_icon" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ba1a2b9896a1c214372f9d76a7d" UNIQUE ("code"), CONSTRAINT "PK_6638d44dae9d9a910225cfc20fb" PRIMARY KEY ("id"))`,
    );

    // * CATEGORY TABLE
    await queryRunner.query(
      `CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "is_enabled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "icon_id" uuid, CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );

    // * MODEL TABLE
    await queryRunner.query(
      `CREATE TABLE "model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "slug" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7debb3b99f60ffb46b981351623" UNIQUE ("slug"), CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`,
    );

    // * IMAGE RESOURCE TYPE ENUM
    await queryRunner.query(
      `CREATE TYPE "public"."image_resource_provider_enum" AS ENUM('cloudinary', 'aws', 'google')`,
    );

    // * IMAGE RESOURCE TABLE
    await queryRunner.query(
      `CREATE TABLE "image_resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text NOT NULL, "file_name" text, "description" text, "description_en" text, "public_id" text, "width" integer, "height" integer, "format" text, "resource_type" text, "provider" "public"."image_resource_provider_enum", "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e91b9eb58a096638369851bf2a8" PRIMARY KEY ("id"))`,
    );

    // * LANGUAGE TABLE
    await queryRunner.query(
      `CREATE TABLE "language" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "code" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7df7d1e250ea2a416f078a631fb" UNIQUE ("name"), CONSTRAINT "UQ_465b3173cdddf0ac2d3fe73a33c" UNIQUE ("code"), CONSTRAINT "PK_cc0a99e710eb3733f6fb42b1d4c" PRIMARY KEY ("id"))`,
    );

    // * REVIEW TABLE
    await queryRunner.query(
      `CREATE TABLE "review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" smallint NOT NULL DEFAULT '5', "is_public" boolean NOT NULL DEFAULT false, "comment" text NOT NULL DEFAULT '', "approved" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "place_id" uuid, "lodging_id" uuid, "experience_id" uuid, CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`,
    );

    // * USER TABLE
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" text NOT NULL, "email" text NOT NULL, "password" text, "profile_photo" json, "email_verified_at" TIMESTAMP, "is_super_user" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "role_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );

    // * LODGING CATEGORY TABLE
    await queryRunner.query(
      `CREATE TABLE "lodging_category" ("lodging_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_4971617e45af1026e513fa99d99" PRIMARY KEY ("lodging_id", "category_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_34494b0c05038b0c742335088d" ON "lodging_category" ("lodging_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_3fa44dad27d1296f97aa8941b5" ON "lodging_category" ("category_id") `);
    await queryRunner.query(
      `CREATE TABLE "lodging_facility" ("lodging_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_cf05321bfe7f1b5a051af2dfcb4" PRIMARY KEY ("lodging_id", "facility_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_3ed3be42aee4509b130c13b446" ON "lodging_facility" ("lodging_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_7b119897e460bbc3039e60dfc3" ON "lodging_facility" ("facility_id") `);

    // * EXPERIENCE FACILITY TABLE
    await queryRunner.query(
      `CREATE TABLE "experience_facility" ("experience_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_3b9e43062a9b5dd2182fd8e82c3" PRIMARY KEY ("experience_id", "facility_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_932ada8d95bc38b0b8fe86f807" ON "experience_facility" ("experience_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_7b978885f2771378c2d4bff28c" ON "experience_facility" ("facility_id") `);

    // * EXPERIENCE CATEGORY TABLE
    await queryRunner.query(
      `CREATE TABLE "experience_category" ("experience_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_50fb95b2e515f179417c561cdbd" PRIMARY KEY ("experience_id", "category_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4497ddeb568c49878a06f55dd3" ON "experience_category" ("experience_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_478c61890de675fff43012c827" ON "experience_category" ("category_id") `);

    // * RESTAURANT CATEGORY TABLE
    await queryRunner.query(
      `CREATE TABLE "restaurant_category" ("restaurant_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_1161700152d02c42360f829aaa0" PRIMARY KEY ("restaurant_id", "category_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b9f81c9708a9ccd5e3c7b82e32" ON "restaurant_category" ("restaurant_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_355400610db376e89b96456c67" ON "restaurant_category" ("category_id") `);

    // * RESTAURANT FACILITY TABLE
    await queryRunner.query(
      `CREATE TABLE "restaurant_facility" ("restaurant_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_7f18b9a6e87207c9939b5d2e4d7" PRIMARY KEY ("restaurant_id", "facility_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4dd7c143b9427190da050bd520" ON "restaurant_facility" ("restaurant_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_69826ba4dd2e6c269d1d9d4f25" ON "restaurant_facility" ("facility_id") `);

    // * PLACE CATEGORY TABLE
    await queryRunner.query(
      `CREATE TABLE "place_facility" ("place_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_7fc97e93165c4314f2b2f54208b" PRIMARY KEY ("place_id", "facility_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_7ecf9665e980f2efc522bf4ea1" ON "place_facility" ("place_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_9fee43f17770fe8dc70c453666" ON "place_facility" ("facility_id") `);

    // * PLACE CATEGORY TABLE
    await queryRunner.query(
      `CREATE TABLE "place_category" ("place_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_3c89aa9ffa66a5c4295a07a0686" PRIMARY KEY ("place_id", "category_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_17d749fcb77b8fc572661920d6" ON "place_category" ("place_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_c20a3c9bd7b54e6e15f13e3ae9" ON "place_category" ("category_id") `);

    // * MODEL CATEGORY TABLE
    await queryRunner.query(
      `CREATE TABLE "model_category" ("model_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_82fcd382e486ea39ab18a3ad63a" PRIMARY KEY ("model_id", "category_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_0a8155c4390c0db3ee209bcdbd" ON "model_category" ("model_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_1145a90d708f1f3bbc9b5038e0" ON "model_category" ("category_id") `);

    // * MODEL FACILITY TABLE
    await queryRunner.query(
      `CREATE TABLE "model_facility" ("model_id" uuid NOT NULL, "facility_id" uuid NOT NULL, CONSTRAINT "PK_83ff0f7d12412b9709c835d1289" PRIMARY KEY ("model_id", "facility_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_59c517a0a8ea00b969be6c20d2" ON "model_facility" ("model_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_77d856890e0ae6170641a89fdf" ON "model_facility" ("facility_id") `);

    // * REVIEW IMAGE TABLE
    await queryRunner.query(
      `CREATE TABLE "review_image" ("reviewId" uuid NOT NULL, "imageResourceId" uuid NOT NULL, CONSTRAINT "PK_39cdb37c460fafccdfad3b131f6" PRIMARY KEY ("reviewId", "imageResourceId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_f0a1a48c40bcb0585f111015e5" ON "review_image" ("reviewId") `);
    await queryRunner.query(`CREATE INDEX "IDX_eb192dab88c8168fee0d2c54df" ON "review_image" ("imageResourceId") `);
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "town_info" ADD CONSTRAINT "FK_53ed4a2b69532c8c630a22ac997" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "town_festivity" ADD CONSTRAINT "FK_68ac172920729760d5c800eade3" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_image" ADD CONSTRAINT "FK_435b0aa817939e3800ea9ff8d80" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_image" ADD CONSTRAINT "FK_62d941ea7ac0742aa39c901e136" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging" ADD CONSTRAINT "FK_54c241de2f9b8f539de88a6e972" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_image" ADD CONSTRAINT "FK_2c589c23974b417d50c2766a2ee" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_image" ADD CONSTRAINT "FK_74e7172a85d15d15d3a148f97a4" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience" ADD CONSTRAINT "FK_6189389856e1d6ceec45613a494" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_image" ADD CONSTRAINT "FK_ec5aaeb9b351d8233e8751015ab" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_image" ADD CONSTRAINT "FK_c283f279dcff7582929cde4dec5" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant" ADD CONSTRAINT "FK_ad6e8ba4b7cac37de67bcf0e005" FOREIGN KEY ("town_id") REFERENCES "town"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant" ADD CONSTRAINT "FK_2ec0e43b8552a729fa87fa7a4b4" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "town" ADD CONSTRAINT "FK_b0e3889db051ff7334fcc6ec22d" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
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
      `ALTER TABLE "facility" ADD CONSTRAINT "FK_61b0bcafa951a675aa0a7842402" FOREIGN KEY ("icon_id") REFERENCES "app_icon"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_4acc05cb7efa59a5018cdd76d39" FOREIGN KEY ("icon_id") REFERENCES "app_icon"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_81446f2ee100305f42645d4d6c2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_d11650864e93b23444d1634d766" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_1f351c0d726c6093d80e7fc5555" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review" ADD CONSTRAINT "FK_cd173603c99ea9a81a0c18c5098" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_category" ADD CONSTRAINT "FK_34494b0c05038b0c742335088dd" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_category" ADD CONSTRAINT "FK_3fa44dad27d1296f97aa8941b50" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_facility" ADD CONSTRAINT "FK_3ed3be42aee4509b130c13b446a" FOREIGN KEY ("lodging_id") REFERENCES "lodging"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_facility" ADD CONSTRAINT "FK_7b119897e460bbc3039e60dfc3c" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_facility" ADD CONSTRAINT "FK_932ada8d95bc38b0b8fe86f807a" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_facility" ADD CONSTRAINT "FK_7b978885f2771378c2d4bff28c6" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_category" ADD CONSTRAINT "FK_4497ddeb568c49878a06f55dd3b" FOREIGN KEY ("experience_id") REFERENCES "experience"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_category" ADD CONSTRAINT "FK_478c61890de675fff43012c8275" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_category" ADD CONSTRAINT "FK_b9f81c9708a9ccd5e3c7b82e32c" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_category" ADD CONSTRAINT "FK_355400610db376e89b96456c67a" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_facility" ADD CONSTRAINT "FK_4dd7c143b9427190da050bd5204" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_facility" ADD CONSTRAINT "FK_69826ba4dd2e6c269d1d9d4f25b" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_facility" ADD CONSTRAINT "FK_7ecf9665e980f2efc522bf4ea1f" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_facility" ADD CONSTRAINT "FK_9fee43f17770fe8dc70c4536663" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_category" ADD CONSTRAINT "FK_17d749fcb77b8fc572661920d62" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "place_category" ADD CONSTRAINT "FK_c20a3c9bd7b54e6e15f13e3ae9c" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_category" ADD CONSTRAINT "FK_0a8155c4390c0db3ee209bcdbd4" FOREIGN KEY ("model_id") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_category" ADD CONSTRAINT "FK_1145a90d708f1f3bbc9b5038e01" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_facility" ADD CONSTRAINT "FK_59c517a0a8ea00b969be6c20d2c" FOREIGN KEY ("model_id") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "model_facility" ADD CONSTRAINT "FK_77d856890e0ae6170641a89fdf1" FOREIGN KEY ("facility_id") REFERENCES "facility"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_f0a1a48c40bcb0585f111015e5a" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_image" ADD CONSTRAINT "FK_eb192dab88c8168fee0d2c54dfc" FOREIGN KEY ("imageResourceId") REFERENCES "image_resource"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_eb192dab88c8168fee0d2c54dfc"`);
    await queryRunner.query(`ALTER TABLE "review_image" DROP CONSTRAINT "FK_f0a1a48c40bcb0585f111015e5a"`);
    await queryRunner.query(`ALTER TABLE "model_facility" DROP CONSTRAINT "FK_77d856890e0ae6170641a89fdf1"`);
    await queryRunner.query(`ALTER TABLE "model_facility" DROP CONSTRAINT "FK_59c517a0a8ea00b969be6c20d2c"`);
    await queryRunner.query(`ALTER TABLE "model_category" DROP CONSTRAINT "FK_1145a90d708f1f3bbc9b5038e01"`);
    await queryRunner.query(`ALTER TABLE "model_category" DROP CONSTRAINT "FK_0a8155c4390c0db3ee209bcdbd4"`);
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_c20a3c9bd7b54e6e15f13e3ae9c"`);
    await queryRunner.query(`ALTER TABLE "place_category" DROP CONSTRAINT "FK_17d749fcb77b8fc572661920d62"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_9fee43f17770fe8dc70c4536663"`);
    await queryRunner.query(`ALTER TABLE "place_facility" DROP CONSTRAINT "FK_7ecf9665e980f2efc522bf4ea1f"`);
    await queryRunner.query(`ALTER TABLE "restaurant_facility" DROP CONSTRAINT "FK_69826ba4dd2e6c269d1d9d4f25b"`);
    await queryRunner.query(`ALTER TABLE "restaurant_facility" DROP CONSTRAINT "FK_4dd7c143b9427190da050bd5204"`);
    await queryRunner.query(`ALTER TABLE "restaurant_category" DROP CONSTRAINT "FK_355400610db376e89b96456c67a"`);
    await queryRunner.query(`ALTER TABLE "restaurant_category" DROP CONSTRAINT "FK_b9f81c9708a9ccd5e3c7b82e32c"`);
    await queryRunner.query(`ALTER TABLE "experience_category" DROP CONSTRAINT "FK_478c61890de675fff43012c8275"`);
    await queryRunner.query(`ALTER TABLE "experience_category" DROP CONSTRAINT "FK_4497ddeb568c49878a06f55dd3b"`);
    await queryRunner.query(`ALTER TABLE "experience_facility" DROP CONSTRAINT "FK_7b978885f2771378c2d4bff28c6"`);
    await queryRunner.query(`ALTER TABLE "experience_facility" DROP CONSTRAINT "FK_932ada8d95bc38b0b8fe86f807a"`);
    await queryRunner.query(`ALTER TABLE "lodging_facility" DROP CONSTRAINT "FK_7b119897e460bbc3039e60dfc3c"`);
    await queryRunner.query(`ALTER TABLE "lodging_facility" DROP CONSTRAINT "FK_3ed3be42aee4509b130c13b446a"`);
    await queryRunner.query(`ALTER TABLE "lodging_category" DROP CONSTRAINT "FK_3fa44dad27d1296f97aa8941b50"`);
    await queryRunner.query(`ALTER TABLE "lodging_category" DROP CONSTRAINT "FK_34494b0c05038b0c742335088dd"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_cd173603c99ea9a81a0c18c5098"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_1f351c0d726c6093d80e7fc5555"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_d11650864e93b23444d1634d766"`);
    await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_81446f2ee100305f42645d4d6c2"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_4acc05cb7efa59a5018cdd76d39"`);
    await queryRunner.query(`ALTER TABLE "facility" DROP CONSTRAINT "FK_61b0bcafa951a675aa0a7842402"`);
    await queryRunner.query(`ALTER TABLE "place" DROP CONSTRAINT "FK_579d731c4d4dc7f0dccc33c6aa9"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_dfbc68191e4bd510f023d8bbe77"`);
    await queryRunner.query(`ALTER TABLE "place_image" DROP CONSTRAINT "FK_ef9fcb6a7d95fd5f4242e696898"`);
    await queryRunner.query(`ALTER TABLE "town" DROP CONSTRAINT "FK_b0e3889db051ff7334fcc6ec22d"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_2ec0e43b8552a729fa87fa7a4b4"`);
    await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "FK_ad6e8ba4b7cac37de67bcf0e005"`);
    await queryRunner.query(`ALTER TABLE "restaurant_image" DROP CONSTRAINT "FK_c283f279dcff7582929cde4dec5"`);
    await queryRunner.query(`ALTER TABLE "restaurant_image" DROP CONSTRAINT "FK_ec5aaeb9b351d8233e8751015ab"`);
    await queryRunner.query(`ALTER TABLE "experience" DROP CONSTRAINT "FK_6189389856e1d6ceec45613a494"`);
    await queryRunner.query(`ALTER TABLE "experience_image" DROP CONSTRAINT "FK_74e7172a85d15d15d3a148f97a4"`);
    await queryRunner.query(`ALTER TABLE "experience_image" DROP CONSTRAINT "FK_2c589c23974b417d50c2766a2ee"`);
    await queryRunner.query(`ALTER TABLE "lodging" DROP CONSTRAINT "FK_54c241de2f9b8f539de88a6e972"`);
    await queryRunner.query(`ALTER TABLE "lodging_image" DROP CONSTRAINT "FK_62d941ea7ac0742aa39c901e136"`);
    await queryRunner.query(`ALTER TABLE "lodging_image" DROP CONSTRAINT "FK_435b0aa817939e3800ea9ff8d80"`);
    await queryRunner.query(`ALTER TABLE "town_festivity" DROP CONSTRAINT "FK_68ac172920729760d5c800eade3"`);
    await queryRunner.query(`ALTER TABLE "town_info" DROP CONSTRAINT "FK_53ed4a2b69532c8c630a22ac997"`);
    await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_eb192dab88c8168fee0d2c54df"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0a1a48c40bcb0585f111015e5"`);
    await queryRunner.query(`DROP TABLE "review_image"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_77d856890e0ae6170641a89fdf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_59c517a0a8ea00b969be6c20d2"`);
    await queryRunner.query(`DROP TABLE "model_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1145a90d708f1f3bbc9b5038e0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0a8155c4390c0db3ee209bcdbd"`);
    await queryRunner.query(`DROP TABLE "model_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c20a3c9bd7b54e6e15f13e3ae9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17d749fcb77b8fc572661920d6"`);
    await queryRunner.query(`DROP TABLE "place_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9fee43f17770fe8dc70c453666"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7ecf9665e980f2efc522bf4ea1"`);
    await queryRunner.query(`DROP TABLE "place_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69826ba4dd2e6c269d1d9d4f25"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4dd7c143b9427190da050bd520"`);
    await queryRunner.query(`DROP TABLE "restaurant_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_355400610db376e89b96456c67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b9f81c9708a9ccd5e3c7b82e32"`);
    await queryRunner.query(`DROP TABLE "restaurant_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_478c61890de675fff43012c827"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4497ddeb568c49878a06f55dd3"`);
    await queryRunner.query(`DROP TABLE "experience_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7b978885f2771378c2d4bff28c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_932ada8d95bc38b0b8fe86f807"`);
    await queryRunner.query(`DROP TABLE "experience_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7b119897e460bbc3039e60dfc3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3ed3be42aee4509b130c13b446"`);
    await queryRunner.query(`DROP TABLE "lodging_facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3fa44dad27d1296f97aa8941b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_34494b0c05038b0c742335088d"`);
    await queryRunner.query(`DROP TABLE "lodging_category"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "review"`);
    await queryRunner.query(`DROP TABLE "language"`);
    await queryRunner.query(`DROP TABLE "image_resource"`);
    await queryRunner.query(`DROP TYPE "public"."image_resource_provider_enum"`);
    await queryRunner.query(`DROP TABLE "model"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "app_icon"`);
    await queryRunner.query(`DROP TABLE "facility"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_497f3216ef683acf6954bd6fb2"`);
    await queryRunner.query(`DROP TABLE "place"`);
    await queryRunner.query(`DROP TABLE "place_image"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_21a0c332038a4c1bc517b8ee5b"`);
    await queryRunner.query(`DROP TABLE "town"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4e247203bbc0618c88786121c"`);
    await queryRunner.query(`DROP TABLE "restaurant"`);
    await queryRunner.query(`DROP TABLE "restaurant_image"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ca6bceb620a621ee97b4fdfaa1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b800b3c7fb310c5e709d0db33c"`);
    await queryRunner.query(`DROP TABLE "experience"`);
    await queryRunner.query(`DROP TABLE "experience_image"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_efb0417aefc5c66891199db7f3"`);
    await queryRunner.query(`DROP TABLE "lodging"`);
    await queryRunner.query(`DROP TABLE "lodging_image"`);
    await queryRunner.query(`DROP TABLE "town_festivity"`);
    await queryRunner.query(`DROP TABLE "department"`);
    await queryRunner.query(`DROP TABLE "town_info"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d3e43ae2fc42f035d710dc44"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "role"`);
  }
}
