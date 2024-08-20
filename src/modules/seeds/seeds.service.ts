import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { read, utils, WorkBook } from 'xlsx';
import { DataSource, Repository } from 'typeorm';

import { Department, Town } from '../towns/entities';
import { Category, Facility, ImageResource, Language, Model } from '../core/entities';
import { CATEGORIES, DEPARTMENTS, FACILITIES, LANGUAGES, MODELS, TOWNS } from './constants';
import * as placeListData from './mocks/places.json';
import { Place, PlaceImage } from '../places/entities';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { FileSheetsEnum } from './enums/file-sheets.enum';
import {
  SheetCategory,
  SheetDepartment,
  SheetFacility,
  SheetIcon,
  SheetLanguages,
  SheetModel,
  SheetPlace,
  SheetTown,
} from './interfaces';
import { isUUID } from 'class-validator';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger('SeedsService');

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,

    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,

    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,

    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,

    @InjectRepository(PlaceImage)
    private readonly placeImageRepository: Repository<PlaceImage>,

    @InjectRepository(ImageResource)
    private readonly imageResourceRepository: Repository<ImageResource>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create() {
    this.logger.log('Creating seed...');
    // await this.truncateAllTables();
    await this.createModels();
    await this.createTowns();
    await this.createLanguages();
    await this.createFacilities();
    await this.createCategories();
    await this.createPlaces();
    this.logger.log('Seed created successfully');
    return 'The seed has been created successfully';
  }

  private async truncateAllTables() {
    this.logger.log('Start truncating all tables...');
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Desactivar temporalmente las restricciones de clave foránea en Postgres
      this.logger.log('Disabling foreign key constraints');
      await queryRunner.query('SET session_replication_role = replica;');

      // Recupero todas la tablas de la base de datos omitiendo la tabla de migraciones
      this.logger.log('Getting all tables from the database');
      const tables = await queryRunner.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name != 'migrations';`,
      );

      // Get images before truncating the tables
      this.logger.log('Getting all images from the database before truncating the tables');
      const images = await this.imageResourceRepository.find();

      // Truncar todas las tablas y reiniciar las secuencias
      for (const { table_name } of tables) {
        this.logger.log(`Truncating table ${table_name}`);
        await queryRunner.query(`TRUNCATE TABLE "${table_name}" RESTART IDENTITY CASCADE;`);
      }

      // Destroy all images from Cloudinary
      this.logger.log(`Destroying ${images.length} images from Cloudinary`);
      images.forEach(image => this.cloudinaryService.destroyFile(image.publicId));

      // reactivar las claves foraneas y confirmar la transacción
      await queryRunner.query('SET session_replication_role = DEFAULT;');
      await queryRunner.commitTransaction();
      this.logger.log('All tables have been truncated successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createModels() {
    this.logger.log('Creating models...');

    const models: Model[] = [];

    for (const model of Object.values(MODELS)) {
      const existingModel = await this.modelRepository.exists({ where: { id: model.id } });
      if (!existingModel) {
        this.logger.log(`Creating model ${model.name}`);
        models.push(this.modelRepository.create(model));
      }

      if (existingModel) this.logger.log(`Model ${model.name} already exists`);
    }

    await this.modelRepository.save(models);
  }

  private async createTowns() {
    this.logger.log('Creating towns...');

    const existingDepartment = await this.departmentRepository.exists({ where: { id: DEPARTMENTS.antioquia.id } });

    if (existingDepartment) this.logger.log('Department Antioquia already exists');

    if (!existingDepartment) {
      this.logger.log('Creating department Antioquia');
      await this.departmentRepository.save(DEPARTMENTS.antioquia);
    }

    const towns: Town[] = [];

    for (const town of TOWNS) {
      const existingTown = await this.townRepository.exists({ where: { id: town.id } });
      if (!existingTown) {
        this.logger.log(`Creating town ${town.name}`);
        towns.push(this.townRepository.create(town));
      }

      if (existingTown) this.logger.log(`Town ${town.name} already exists`);
    }

    await this.townRepository.save(towns);
  }

  private async createLanguages() {
    this.logger.log('Creating languages...');

    const languages: Language[] = [];

    for (const language of LANGUAGES) {
      const existingLanguage = await this.languageRepository.exists({ where: { id: language.id } });

      if (!existingLanguage) {
        this.logger.log(`Creating language ${language.name}`);
        languages.push(this.languageRepository.create(language));
      }

      if (existingLanguage) this.logger.log(`Language ${language.name} already exists`);
    }

    await this.languageRepository.save(languages);
  }

  private async createFacilities() {
    this.logger.log('Creating facilities...');
    const facilities: Facility[] = [];
    for (const facility of FACILITIES) {
      const existingFacility = await this.facilityRepository.exists({ where: { id: facility.id } });
      if (!existingFacility) {
        this.logger.log(`Creating facility ${facility.name}`);
        facilities.push(this.facilityRepository.create(facility));
      }

      if (existingFacility) this.logger.log(`Facility ${facility.name} already exists`);
    }

    await this.facilityRepository.save(facilities);
  }

  private async createCategories() {
    this.logger.log('Creating categories...');

    const categories: Category[] = [];

    for (const category of CATEGORIES) {
      const existingCategory = await this.categoryRepository.exists({ where: { id: category.id } });

      if (!existingCategory) {
        this.logger.log(`Creating category ${category.name}`);
        categories.push(this.categoryRepository.create(category));
      }

      if (existingCategory) this.logger.log(`Category ${category.name} already exists`);
    }

    await this.categoryRepository.save(categories);
  }

  private async createPlaces() {
    this.logger.log('Creating places...');
    const imagesIds: string[] = [];

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const placeData of placeListData) {
        const existingPlace = await this.placeRepository.exists({ where: { id: placeData.id } });
        if (existingPlace) {
          this.logger.log(`Place ${placeData.name} already exists`);
          continue;
        }

        this.logger.log(`Creating place ${placeData.name}`);
        // const categories = placeData.categories
        //   .map(category => CATEGORIES.find(c => c.name === category.name))
        //   .filter(Boolean)
        //   .map(categoryFound => ({ id: categoryFound.id }));
        const categories = placeData.categories.flatMap(category => {
          const categoryFound = CATEGORIES.find(c => c.name === category.name);
          return categoryFound ? { id: categoryFound.id } : [];
        });

        const facilities = placeData.facilities.flatMap(facility => {
          const facilityFound = FACILITIES.find(f => f.name === facility.name);
          return facilityFound ? { id: facilityFound.id } : [];
        });

        const place = await queryRunner.manager.save(Place, {
          id: placeData.id,
          town: { id: TOWNS[0].id },
          categories,
          facilities,
          name: placeData.name,
          slug: placeData.slug,
          description: placeData.description,
          difficultyLevel: placeData.difficult_level || 1,
          rating: 0,
          points: placeData.points,
          reviewCount: 0,
          location: { type: 'Point', coordinates: [+placeData.longitude, +placeData.latitude] },
          urbarCenterDistance: placeData.total_distance,
          googleMapsUrl: placeData.google_maps_link ?? undefined,
          history: placeData.history ?? undefined,
          temperature: placeData.temperature ?? undefined,
          maxDepth: placeData.max_depth ?? undefined,
          altitude: placeData.altitude ?? undefined,
          capacity: placeData.capacity,
          minAge: placeData.min_age ?? undefined,
          maxAge: placeData.max_age ?? undefined,
          howToGetThere: placeData.how_to_get_there,
          howToDress: placeData.how_to_dress ?? undefined,
          restrictions: placeData.restrictions ?? undefined,
          recommendations: placeData.recommendations ?? undefined,
          observations: placeData.observations ?? undefined,
        });

        const imagesUrls: string[] = [placeData.image, ...placeData.images];
        const cloudinaryRes = await Promise.all(
          imagesUrls.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, placeData.name, CloudinaryPresets.PLACE_PHOTO),
          ),
        );

        const images = cloudinaryRes
          .filter(res => typeof res !== 'undefined')
          .map(res => {
            imagesIds.push(res.publicId);
            return this.imageResourceRepository.create({
              publicId: res.publicId,
              url: res.url,
              fileName: place.name,
              width: res.width,
              height: res.height,
              format: res.format,
              resourceType: res.type,
              provider: ResourceProvider.Cloudinary,
            });
          });

        await queryRunner.manager.save(ImageResource, images);

        const placeImages = images.map((image, index) =>
          this.placeImageRepository.create({ imageResource: image, order: index + 1, place }),
        );

        await queryRunner.manager.save(PlaceImage, placeImages);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(error.message);
      if (imagesIds.length) await Promise.all(imagesIds.map(id => this.cloudinaryService.destroyFile(id)));
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async seedFromFile(file: Express.Multer.File, truncate?: boolean, sheet?: FileSheetsEnum) {
    if (truncate) this.truncateAllTables();
    console.log(sheet);

    const workbook = read(file.buffer, { type: 'buffer' });
    const models = this.getModelsFromWorkbook(workbook);
    const departments = this.getDepartmentsFromWorkboob(workbook);
    const towns = this.getTownsFromWorkbook(workbook);
    const languages = this.getLanguagesFromWorkbook(workbook);
    const icons = this.getIconsFromWorkbook(workbook);
    const categories = this.getCategoriesFromWorkbook(workbook);
    const facilities = this.getFacilitiesFromWorkbook(workbook);
    const places = await this.getPlacesFromWorkbook(workbook);

    return { places, facilities, categories, icons, languages, towns, departments, models };
  }

  private getModelsFromWorkbook(workbook: WorkBook): SheetModel[] {
    const headers = ['id', 'name', 'slug', 'sl'];

    const sheet = workbook.Sheets[FileSheetsEnum.models];
    const json = utils.sheet_to_json<SheetModel>(sheet, { header: headers as string[], range: 1 });

    const models = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        return row;
      })
      .filter((row): row is SheetModel => row !== null);

    return models;
  }

  private getDepartmentsFromWorkboob(workbook: WorkBook): SheetDepartment[] {
    const headers = ['id', 'name', 'capital', 'number'];

    const sheet = workbook.Sheets[FileSheetsEnum.departments];
    const json = utils.sheet_to_json<SheetDepartment>(sheet, { header: headers, range: 1 });

    const departments = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name) return null;
        return row;
      })
      .filter((row): row is SheetDepartment => row !== null);

    return departments;
  }

  private getTownsFromWorkbook(workbook: WorkBook): SheetTown[] {
    const headers = ['id', 'name', 'description', 'departmentNumber', 'enabled', 'longitude', 'latitude'];

    const sheet = workbook.Sheets[FileSheetsEnum.towns];
    const json = utils.sheet_to_json<SheetTown>(sheet, { header: headers, range: 1 });

    const towns = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name) return null;
        return row;
      })
      .filter((row): row is SheetTown => row !== null);

    return towns;
  }

  private getLanguagesFromWorkbook(workbook: WorkBook): SheetLanguages[] {
    const headers = ['id', 'name', 'code'];

    const sheet = workbook.Sheets[FileSheetsEnum.languages];
    const json = utils.sheet_to_json<SheetLanguages>(sheet, { header: headers, range: 1 });

    const languages = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.code) return null;
        return row;
      })
      .filter((row): row is SheetLanguages => row !== null);

    return languages;
  }

  private getIconsFromWorkbook(workbook: WorkBook): SheetIcon[] {
    const headers = ['id', 'name', 'code'];

    const sheet = workbook.Sheets[FileSheetsEnum.icons];
    const json = utils.sheet_to_json<SheetIcon>(sheet, { header: headers, range: 1 });

    const icons = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.code) return null;
        return row;
      })
      .filter((row): row is SheetIcon => row !== null);

    return icons;
  }

  private getCategoriesFromWorkbook(workbook: WorkBook): SheetCategory[] {
    const headers = ['id', 'name', 'slug', 'icon', 'models'];

    const sheet = workbook.Sheets[FileSheetsEnum.categories];
    const json = utils.sheet_to_json<SheetCategory>(sheet, { header: headers, range: 1 });

    const categories = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        return row;
      })
      .filter((row): row is SheetCategory => row !== null);

    return categories;
  }

  private getFacilitiesFromWorkbook(workbook: WorkBook): SheetFacility[] {
    const headers = ['id', 'name', 'slug', 'models'];

    const sheet = workbook.Sheets[FileSheetsEnum.facilities];
    const json = utils.sheet_to_json<SheetFacility>(sheet, { header: headers, range: 1 });

    const facilities = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        return row;
      })
      .filter((row): row is SheetFacility => row !== null);

    return facilities;
  }

  private async getPlacesFromWorkbook(workbook: WorkBook): Promise<SheetPlace[]> {
    const headers = [
      'id',
      'order',
      'name',
      'slug',
      'imageCount',
      'zone',
      'description',
      'longitude',
      'latitude',
      'googleMapsLink',
      'driveFolderLink',
      'cloudinaryFolder',
      'difficulty',
      'facilities',
      'pooints',
      'distance',
      'altitude',
      'howToGetThere',
      'town',
      'category',
      'arrivalReference',
      'transportReference',
      'maxDeep',
      'capacity',
      'minAge',
      'maxAge',
      'recomendations',
      'howToDress',
      'temperature',
    ];

    const sheet = workbook.Sheets[FileSheetsEnum.places];
    const json = utils.sheet_to_json<SheetPlace>(sheet, { header: headers, range: 1 });

    // console.log('json', json);
    const sheetPlaces = json
      .map(row => {
        if (!isUUID(row.id)) return null;
        if (!row.name || !row.slug) return null;
        if (!row.description) return null;
        if (!row.longitude || !row.latitude) return null;
        if (!row.town) return null;
        if (!row.cloudinaryFolder) return null;
        if (!row.category) return null;

        const points = row.points || 1;
        const difficulty = row.difficulty ?? 1;
        const images: string[] = [];
        return { ...row, difficulty, points, images, foo: 'foo' };
      })
      .filter(row => row !== null);

    // console.log('sheetPlaces', sheetPlaces);

    const places: SheetPlace[] = [];
    const baseFolder = 'banco-de-imagenes/places';

    for (let index = 0; index < sheetPlaces.length; index++) {
      const sheetPlace = sheetPlaces[index];
      const url = `${baseFolder}/${sheetPlace.cloudinaryFolder}`;
      const res = await this.cloudinaryService.getResourceFromFolder(url);
      if (!res || (res.resources.length as number) === 0) continue;

      console.log('clud', res.resources);

      const mainImage = res.resources.findIndex(
        resource => resource.public_id.includes('main') || resource.display_name.includes('main'),
      );
      const images: string[] = [];
      if (mainImage !== -1) images.push(res.resources[mainImage].secure_url);
      res.resources.forEach((resource, i) => {
        if (i === mainImage) return;
        images.push(resource.secure_url);
      });

      places.push({ ...sheetPlace, images });
    }

    return places;
  }
}
