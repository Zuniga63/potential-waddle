import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Some lodgings (apartments, whole houses, even small hotels that don't want
 * to enumerate room types) shouldn't be forced to register lodgingRoomTypes
 * to satisfy the wizard's completion gate. This boolean lets the owner opt out
 * of the room-types requirement; computeLodgingCompletion treats the Rooms
 * bucket as satisfied when this flag is true.
 */
export class AddLodgingRoomsNotApplicable1773400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" ADD COLUMN "rooms_not_applicable" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lodging" DROP COLUMN "rooms_not_applicable"`);
  }
}
