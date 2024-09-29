import { MigrationInterface, QueryRunner } from 'typeorm';
import { AddRestaurantTableAndRelations1727384916401 } from './1727384916401-add-restaurant-table-and-relations';
import { AddExperienceTableAndRelations1727272923674 } from './1727272923674-add-experience-table-and-relations';
import { AddLodgingTableAndRelations1727098614695 } from './1727098614695-add-lodging-table-and-relations';
import { ChangeSlugToCodeInAppIcon1724266628118 } from './1724266628118-change-slug-to-code-in-app-icon';
import { AddIsEnabledToTownEntity1724170001055 } from './1724170001055-add-is-enabled-to-town-entity';
import { RemoveTownUniqueName1724105104819 } from './1724105104819-remove-town-unique-name';
import { RemoveDepartmentUniqueName1724104845493 } from './1724104845493-remove-department-unique-name';
import { AddSlugToModel1724104519197 } from './1724104519197-add_slug_to_model';
import { AddReviewTable1723489354516 } from './1723489354516-add_review_table';
import { ChangePlaceRatingToFloat1722865565896 } from './1722865565896-change-place-rating-to-float';
import { InitialDbStructure1722179653907 } from './1722179653907-initial-db-structure';

export class RevertChanges1727393426929 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // * REVERT RESTAURANTS MODULE
    const restaurant = new AddRestaurantTableAndRelations1727384916401();
    await restaurant.down(queryRunner);

    // * REVERT EXPERIENCES MODULE
    const experience = new AddExperienceTableAndRelations1727272923674();
    await experience.down(queryRunner);

    // * REVERT LODGING MODULE
    const lodging = new AddLodgingTableAndRelations1727098614695();
    await lodging.down(queryRunner);

    // * REVERT CHANGES IN APP ICON
    const appIconChanges = new ChangeSlugToCodeInAppIcon1724266628118();
    await appIconChanges.down(queryRunner);

    // * REMOVE IS ENABLED FROM TOWN ENTITY
    const addColumnTown = new AddIsEnabledToTownEntity1724170001055();
    await addColumnTown.down(queryRunner);

    // * ADD UNIQUE NAME TO TOWN ENTITY
    const uniqueName = new RemoveTownUniqueName1724105104819();
    await uniqueName.down(queryRunner);

    // * ADD UNIQUE NAME TO DEPARTMENT ENTITY
    const uniqueNameDepartment = new RemoveDepartmentUniqueName1724104845493();
    await uniqueNameDepartment.down(queryRunner);

    // * ADD SLUG TO MODEL
    const addSlugToModel = new AddSlugToModel1724104519197();
    await addSlugToModel.down(queryRunner);

    // * REVERT REVIEW TABLE
    const review = new AddReviewTable1723489354516();
    await review.down(queryRunner);

    // * REVERT CHANGE PLACE RATING TO FLOAT
    const changePlaceRating = new ChangePlaceRatingToFloat1722865565896();
    await changePlaceRating.down(queryRunner);

    // * REVERT INITIAL DB STRUCTURE
    const initial = new InitialDbStructure1722179653907();
    await initial.down(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // * REVERT INITIAL DB STRUCTURE
    const initial = new InitialDbStructure1722179653907();
    await initial.up(queryRunner);

    // * CHANGE PLACE RATING TO FLOAT
    const changePlaceRating = new ChangePlaceRatingToFloat1722865565896();
    await changePlaceRating.up(queryRunner);

    // * ADD REVIEW TABLE
    const review = new AddReviewTable1723489354516();
    await review.up(queryRunner);

    // * ADD SLUG TO MODEL
    const addSlugToModel = new AddSlugToModel1724104519197();
    await addSlugToModel.up(queryRunner);

    // * ADD UNIQUE NAME TO DEPARTMENT ENTITY
    const uniqueNameDepartment = new RemoveDepartmentUniqueName1724104845493();
    await uniqueNameDepartment.up(queryRunner);

    // * REMOVE UNIQUE NAME FROM TOWN ENTITY
    const uniqueName = new RemoveTownUniqueName1724105104819();
    await uniqueName.up(queryRunner);

    // * ADD IS ENABLED TO TOWN ENTITY
    const addColumnTown = new AddIsEnabledToTownEntity1724170001055();
    await addColumnTown.up(queryRunner);

    // * CHANGE SLUG TO CODE IN APP ICON
    const appIconChanges = new ChangeSlugToCodeInAppIcon1724266628118();
    await appIconChanges.up(queryRunner);

    // * CREATE LODGING MODULE
    const lodging = new AddLodgingTableAndRelations1727098614695();
    await lodging.up(queryRunner);

    // * CREATE EXPERIENCES MODULE
    const experience = new AddExperienceTableAndRelations1727272923674();
    await experience.up(queryRunner);

    // * CREATE RESTAURANTS MODULE
    const restaurant = new AddRestaurantTableAndRelations1727384916401();
    await restaurant.up(queryRunner);
  }
}
