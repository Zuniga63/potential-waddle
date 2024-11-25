import { read, utils, type WorkBook } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

import type {
  SheetCategory,
  SheetCategoryData,
  SheetDepartment,
  SheetDepartmentData,
  SheetExperience,
  SheetExperienceData,
  SheetFacility,
  SheetFacilityData,
  SheetIcon,
  SheetIconData,
  SheetLanguage,
  SheetLanguageData,
  SheetLodging,
  SheetLodgingData,
  SheetModel,
  SheetModelData,
  SheetPlace,
  SheetPlaceData,
  SheetRestaurant,
  SheetRestaurantData,
  SheetTown,
  SheetTownData,
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
    const json = utils.sheet_to_json<SheetIconData>(sheet, { header: SHEET_ICON_HEADERS, range: 1 });

    const icons = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.code) return null;

        const id = uuidv4();
        return { id, ...data };
      })
      .filter(row => row !== null);

    return icons;
  }

  public getModels(): SheetModel[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.models];
    const json = utils.sheet_to_json<SheetModelData>(sheet, { header: SHEET_MODEL_HEADERS, range: 1 });

    const models = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.slug) return null;

        const id = uuidv4();
        return { id, ...data };
      })
      .filter(row => row !== null);

    return models;
  }

  public getLanguages(): SheetLanguage[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.languages];
    const json = utils.sheet_to_json<SheetLanguageData>(sheet, { header: SHEET_LANGUAGE_HEADERS, range: 1 });

    const languages = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.code) return null;

        const id = uuidv4();
        return { id, ...data };
      })
      .filter(row => row !== null);

    return languages;
  }

  public getDepartments(): SheetDepartment[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.departments];
    const json = utils.sheet_to_json<SheetDepartmentData>(sheet, { header: SHEET_DEPARTMENT_HEADERS, range: 1 });

    const departments = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name) return null;

        const id = uuidv4();
        return { id, ...data };
      })
      .filter(row => row !== null);

    return departments;
  }

  public getTowns(): SheetTown[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.towns];
    const json = utils.sheet_to_json<SheetTownData>(sheet, { header: SHEET_TOWN_HEADERS, range: 1 });

    const towns = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name) return null;

        const id = uuidv4();
        return { id, ...data };
      })
      .filter(row => row !== null);

    return towns;
  }

  public getCategories(): SheetCategory[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.categories];
    const json = utils.sheet_to_json<SheetCategoryData>(sheet, { header: SHEET_CATEGORY_HEADERS, range: 1 });

    const categories = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.slug) return null;

        const id = uuidv4();
        return { id, ...data };
      })
      .filter(row => row !== null);

    return categories;
  }

  public getFacilities(): SheetFacility[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.facilities];
    const json = utils.sheet_to_json<SheetFacilityData>(sheet, { header: SHEET_FACILITY_HEADERS, range: 1 });

    const facilities = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.slug) return null;

        const id = uuidv4();
        return { id, ...data };
      })
      .filter(row => row !== null);

    return facilities;
  }

  public getPlaces(): SheetPlace[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.places];
    const json = utils.sheet_to_json<SheetPlaceData>(sheet, { header: SHEET_PLACE_HEADERS, range: 1 });

    const sheetPlaces = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.slug) return null;
        if (!data.description) return null;
        if (!data.longitude || !data.latitude) return null;
        if (!data.town) return null;
        if (!data.category) return null;
        if (!data.popularity || data.popularity < 1 || data.popularity > 5) return null;

        const id = uuidv4();
        const points = data.points || 1;
        const difficulty = data.difficulty ?? 1;
        return { id, ...data, difficulty, points, slug: data.slug.trim() };
      })
      .filter(row => row !== null);

    return sheetPlaces;
  }

  public getLodgings(): SheetLodging[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.lodgings];
    const json = utils.sheet_to_json<SheetLodgingData>(sheet, { header: SHEET_LODGING_HEADERS, range: 1 });

    const sheetLodgings = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.slug) return null;
        if (!data.description) return null;
        if (!data.longitude || !data.latitude) return null;
        if (!data.town) return null;
        if (!data.categories) return null;

        const id = uuidv4();
        const roomCount = data.roomCount || '1';
        return { id, ...data, slug: data.slug.trim(), roomCount };
      })
      .filter(row => row !== null);

    return sheetLodgings;
  }

  public getExperiences(): SheetExperience[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.experiences];
    const json = utils.sheet_to_json<SheetExperienceData>(sheet, { header: SHEET_EXPERIENCE_HEADERS, range: 1 });

    const sheetExperiences = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;

        if (!data.title || !data.slug) return null;
        if (!data.description) return null;
        if (!data.departureLongitude || !data.departureLatitude) return null;
        if (!data.arrivalLongitude || !data.arrivalLatitude) return null;
        if (!data.town) return null;
        if (!data.categories) return null;
        if (!data.totalDistance) return null;

        const id = uuidv4();
        const points = data.points || 1;
        const guides = data.guides?.replaceAll('\n', '') || '';

        const experiences: SheetExperience = { id, ...data, points, slug: data.slug.trim(), guides };
        return experiences;
      })
      .filter(row => row !== null);

    return sheetExperiences;
  }

  public getRestaurants(): SheetRestaurant[] {
    const sheet = this.workbook.Sheets[FileSheetsEnum.restaurants];
    const json = utils.sheet_to_json<SheetRestaurantData>(sheet, { header: SHEET_RESTAURANT_HEADERS, range: 1 });

    const sheetRestaurants = json
      .map(({ checked, ...data }) => {
        if (!checked) return null;
        if (!data.name || !data.slug) return null;
        if (!data.description) return null;
        if (!data.longitude || !data.latitude) return null;
        if (!data.town) return null;
        if (!data.categories) return null;

        const id = uuidv4();
        const points = data.points || 1;
        const restaurants: SheetRestaurant = { id, ...data, points, slug: data.slug.trim() };
        return restaurants;
      })
      .filter(row => row !== null);

    return sheetRestaurants;
  }
}
