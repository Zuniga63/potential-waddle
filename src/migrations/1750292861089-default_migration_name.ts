import { MigrationInterface, QueryRunner } from 'typeorm';

export class LodgingRoomTypeImages1750292861089 implements MigrationInterface {
  name = 'LodgingRoomTypeImages1750292861089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lodging_room_type_image" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "order" smallint NOT NULL, 
                "is_public" boolean NOT NULL DEFAULT true, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "room_type_id" uuid, 
                "image_resource_id" uuid, 
                CONSTRAINT "PK_lodging_room_type_image_id" PRIMARY KEY ("id")
            )`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" ADD CONSTRAINT "FK_lodging_room_type_image_room_type" FOREIGN KEY ("room_type_id") REFERENCES "lodging_room_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" ADD CONSTRAINT "FK_lodging_room_type_image_image_resource" FOREIGN KEY ("image_resource_id") REFERENCES "image_resource"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" DROP CONSTRAINT "FK_lodging_room_type_image_image_resource"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lodging_room_type_image" DROP CONSTRAINT "FK_lodging_room_type_image_room_type"`,
    );
    await queryRunner.query(`DROP TABLE "lodging_room_type_image"`);
  }
}
