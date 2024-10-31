import { isUUID } from 'class-validator';
import { read, utils, type WorkBook } from 'xlsx';

import type {
  SheetCategory,
  SheetDepartment,
  SheetExperience,
  SheetFacility,
  SheetIcon,
  SheetLanguage,
  SheetLodging,
  SheetModel,
  SheetPlace,
  SheetRestaurant,
  SheetTown,
} from '../interfaces';
import {
  SHEET_CATEGORY_HEADERS,
  SHEET_DEPARTMENT_HEADERS,
  SHEET_EXPERIENCE_HEADERS,
  SHEET_FACILITY_HEADERS,
  SHEET_ICON_HEADERS,
  SHEET_LANGUAGE_HEADERS,
  SHEET_LODGING_HEADERS,
  SHEET_MODEL_HEADERS,
  SHEET_PLACE_HEADERS,
  SHEET_RESTAURANT_HEADERS,
  SHEET_TOWN_HEADERS,
} from '../constants';
import { FileSheetsEnum } from '../enums';

export class SeedWorkbook {
  private readonly workbook: WorkBook;

  constructor(file: Express.Multer.File) {
    this.workbook = read(file.buffer, { type: 'buffer' });
  }

  public getIcons(): SheetIcon[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.icons];
    const json = utils.sheet_to_json<SheetIcon>(sheet, { header: SHEET_ICON_HEADERS, range: 1 });

    const icons = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.code) return null;
        return row;
      })
      .filter((row): row is SheetIcon => row !== null);

    return icons;
  }

  public getLanguages(): SheetLanguage[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.languages];
    const json = utils.sheet_to_json<SheetLanguage>(sheet, { header: SHEET_LANGUAGE_HEADERS, range: 1 });

    const languages = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.code) return null;
        return row;
      })
      .filter((row): row is SheetLanguage => row !== null);

    return languages;
  }

  public getModels(): SheetModel[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.models];
    const json = utils.sheet_to_json<SheetModel>(sheet, { header: SHEET_MODEL_HEADERS, range: 1 });

    const models = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        return row;
      })
      .filter((row): row is SheetModel => row !== null);

    return models;
  }

  public getDepartments(): SheetDepartment[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.departments];
    const json = utils.sheet_to_json<SheetDepartment>(sheet, { header: SHEET_DEPARTMENT_HEADERS, range: 1 });

    const departments = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name) return null;
        return row;
      })
      .filter((row): row is SheetDepartment => row !== null);

    return departments;
  }

  public getTowns(): SheetTown[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.towns];
    const json = utils.sheet_to_json<SheetTown>(sheet, { header: SHEET_TOWN_HEADERS, range: 1 });

    const towns = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name) return null;
        return row;
      })
      .filter((row): row is SheetTown => row !== null);

    return towns;
  }

  public getCategories(): SheetCategory[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.categories];
    const json = utils.sheet_to_json<SheetCategory>(sheet, { header: SHEET_CATEGORY_HEADERS, range: 1 });

    const categories = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        return row;
      })
      .filter((row): row is SheetCategory => row !== null);

    return categories;
  }

  public getFacilities(): SheetFacility[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.facilities];
    const json = utils.sheet_to_json<SheetFacility>(sheet, { header: SHEET_FACILITY_HEADERS, range: 1 });

    const facilities = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        return row;
      })
      .filter((row): row is SheetFacility => row !== null);

    return facilities;
  }

  public getPlaces(): SheetPlace[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.places];
    const json = utils.sheet_to_json<SheetPlace>(sheet, { header: SHEET_PLACE_HEADERS, range: 1 });

    const sheetPlaces = json
      .map((row): SheetPlace | null => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        if (!row.description) return null;
        if (!row.longitude || !row.latitude) return null;
        if (!row.town) return null;
        if (!row.cloudinaryFolder) return null;
        if (!row.category) return null;
        if (!row.popularity && row.popularity >= 1 && row.popularity <= 5) return null;

        const points = row.points || 1;
        const difficulty = row.difficulty ?? 1;
        return { ...row, difficulty, points, slug: row.slug.trim() };
      })
      .filter(row => row !== null);

    return sheetPlaces;
  }

  public getLodgings(): SheetLodging[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.lodgings];
    const json = utils.sheet_to_json<SheetLodging>(sheet, { header: SHEET_LODGING_HEADERS, range: 1 });

    const sheetLodgings = json
      .map((row): SheetLodging | null => {
        // console.log(row);
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        if (!row.description) return null;
        if (!row.longitude || !row.latitude) return null;
        if (!row.town) return null;
        if (!row.categories) return null;

        const roomCount = row.roomCount || '1';
        return { ...row, slug: row.slug.trim(), roomCount };
      })
      .filter(row => row !== null);

    return sheetLodgings;
  }

  public getExperiences(): SheetExperience[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.experiences];
    const json = utils.sheet_to_json<SheetExperience>(sheet, { header: SHEET_EXPERIENCE_HEADERS, range: 1 });

    const sheetExperiences = json
      .map((row): SheetExperience | null => {
        if (!isUUID(row.id)) return null;
        if (!row.title || !row.slug) return null;
        if (!row.description) return null;
        if (!row.departureLongitude || !row.departureLatitude) return null;
        if (!row.arrivalLongitude || !row.arrivalLatitude) return null;
        if (!row.town) return null;
        if (!row.categories) return null;
        if (!row.totalDistance) return null;

        const points = row.points || 1;
        return { ...row, points, slug: row.slug.trim() };
      })
      .filter(row => row !== null);

    return sheetExperiences;
  }

  public getRestaurants(): SheetRestaurant[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.restaurants];
    const json = utils.sheet_to_json<SheetRestaurant>(sheet, { header: SHEET_RESTAURANT_HEADERS, range: 1 });

    const sheetRestaurants = json
      .map((row): SheetRestaurant | null => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        if (!row.description) return null;
        if (!row.longitude || !row.latitude) return null;
        if (!row.town) return null;
        if (!row.categories) return null;

        const points = row.points || 1;
        return { ...row, points, slug: row.slug.trim() };
      })
      .filter(row => row !== null);

    return sheetRestaurants;
  }
}
