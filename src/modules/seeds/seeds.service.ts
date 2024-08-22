import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { read, utils, WorkBook } from 'xlsx';
import { DataSource, QueryRunner, Repository } from 'typeorm';

import { Department, Town } from '../towns/entities';
import { AppIcon, Category, Facility, ImageResource, Language, Model } from '../core/entities';
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

interface SeedPlaceProps {
  workbook: WorkBook;
  queryRunner: QueryRunner;
  onDeleteImage: (id: string) => void;
  onAddTempImage: (id: string) => void;
}

@Injectable()
export class SeedsService {
  private readonly logger = new Logger('SeedsService');

  constructor(
    @InjectRepository(AppIcon)
    private readonly iconRepository: Repository<AppIcon>,

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
    if (truncate) await this.truncateAllTables();

    const workbook = read(file.buffer, { type: 'buffer' });
    if (!sheet) {
      await this.seedAllWoorkbook(workbook);
      return 'The full workbook has been seeded successfully';
    }

    return 'The seed has been created successfully';
  }

  /**
   *
   * @param workbook
   * @param updateAndCreate if true, it will update the existing records and create new ones if they do not exist
   */
  private async seedAllWoorkbook(workbook: WorkBook) {
    this.logger.log('Start seeding all workbook...');

    const queryRunner = this.dataSource.createQueryRunner();
    const tempImages: string[] = [];
    const imageToDelete: string[] = [];

    const addTempImage = (id: string) => tempImages.push(id);
    const addImageToDelete = (id: string) => imageToDelete.push(id);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.seedIconsFromWorkbook(workbook, queryRunner);
      await this.seedLanguagesFromWorkbook(workbook, queryRunner);
      await this.seedDepartmentsFromWorkbook(workbook, queryRunner);
      await this.seedTownsFromWorkbook(workbook, queryRunner);
      await this.seedModelFromWorkbook(workbook, queryRunner);
      await this.seedCategoriesFromWorkbook(workbook, queryRunner);
      await this.seedFacilitiesFromWorkbook(workbook, queryRunner);
      await this.seedPlacesFromWorkbook({
        workbook,
        queryRunner,
        onAddTempImage: addTempImage,
        onDeleteImage: addImageToDelete,
      });

      await queryRunner.commitTransaction();

      if (imageToDelete.length) {
        this.logger.log(`Destroying ${imageToDelete.length} images from Cloudinary...`);
        await Promise.all(imageToDelete.map(id => this.cloudinaryService.destroyFile(id)));
        this.writeLog('All images have been destroyed successfully');
      }
    } catch (error) {
      this.logger.error(error.message);
      console.log(error);
      if (tempImages.length) {
        this.writeLog(`Destroying ${tempImages.length} temp images from Cloudinary...`);
        await Promise.all(tempImages.map(id => this.cloudinaryService.destroyFile(id)));
        this.writeLog('All temp images have been destroyed successfully');
      }
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
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

  private async seedIconsFromWorkbook(workbook: WorkBook, queryRunner: QueryRunner) {
    this.logger.log('Creating icons...');
    const sheetIcons = this.getIconsFromWorkbook(workbook);

    this.logger.log('\tGet all icons from the database');
    const dbIcons = await this.iconRepository.find();
    this.logger.log(`\tIcons found: ${dbIcons.length}`);

    const icons: AppIcon[] = sheetIcons.map(item => {
      const icon = this.iconRepository.create({ id: item.id, name: item.name, code: item.code });
      const dbIcon = dbIcons.find(i => i.id === icon.id);
      if (!dbIcon) return icon;

      return this.iconRepository.merge(dbIcon, icon);
    });

    this.logger.log('\tSaving icons...');
    await queryRunner.manager.save(AppIcon, icons);
    this.logger.log('\tIcons saved successfully in the database');
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

  private async seedLanguagesFromWorkbook(workbook: WorkBook, queryRunner: QueryRunner) {
    this.logger.log('Creating languages...');
    const sheetLanguages = this.getLanguagesFromWorkbook(workbook);

    this.logger.log('\tGet all languages from the database');
    const dbLanguages = await this.languageRepository.find();
    this.logger.log(`\tLanguages found: ${dbLanguages.length}`);

    const languages: Language[] = sheetLanguages.map(item => {
      const language = this.languageRepository.create({ id: item.id, name: item.name, code: item.code });
      const dbLanguage = dbLanguages.find(l => l.id === language.id);
      if (!dbLanguage) return language;

      return this.languageRepository.merge(dbLanguage, language);
    });

    this.logger.log('\tSaving languages...');
    await queryRunner.manager.save(Language, languages);
    this.logger.log('\tLanguages saved successfully in the database');
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

  private async seedModelFromWorkbook(workbook: WorkBook, queryRunner: QueryRunner) {
    this.logger.log('Creating models...');
    const sheetModel = this.getModelsFromWorkbook(workbook);

    this.logger.log('\tGet all models from the database');
    const dbModels = await this.modelRepository.find();
    this.logger.log(`\tModels found: ${dbModels.length}`);

    const models: Model[] = sheetModel.map(item => {
      const model = this.modelRepository.create({ id: item.id, name: item.name, slug: item.slug });
      const dbModel = dbModels.find(m => m.id === model.id);
      if (!dbModel) return model;

      return this.modelRepository.merge(dbModel, model);
    });

    this.logger.log('\tSaving models...');
    await queryRunner.manager.save(Model, models);
    this.logger.log('\tModels saved successfully in the database');
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

  private async seedDepartmentsFromWorkbook(workbook: WorkBook, queryRunner: QueryRunner) {
    this.logger.log('Creating departments...');
    const sheetDepartments = this.getDepartmentsFromWorkboob(workbook);

    this.logger.log('\tGet all departments from the database');
    const dbDepartments = await this.departmentRepository.find();
    this.logger.log(`\tDepartments found: ${dbDepartments.length}`);

    const departments: Department[] = sheetDepartments.map(item => {
      const department = this.departmentRepository.create({ id: item.id, name: item.name, capital: item.capital });
      const dbDepartment = dbDepartments.find(d => d.id === department.id);
      if (!dbDepartment) return department;

      return this.departmentRepository.merge(dbDepartment, department);
    });

    this.logger.log('\tSaving departments...');
    await queryRunner.manager.save(Department, departments);
    this.logger.log('\tDepartments saved successfully in the database');
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

  private async seedTownsFromWorkbook(workbook: WorkBook, queryRunner: QueryRunner) {
    this.logger.log('Creating towns...');
    const sheetTowns = this.getTownsFromWorkbook(workbook);
    const sheetDepartments = this.getDepartmentsFromWorkboob(workbook);

    this.logger.log('\tGet all towns from the database');
    const dbTowns = await this.townRepository.find();
    this.logger.log(`\tTowns found: ${dbTowns.length}`);

    const towns: Town[] = sheetTowns.map(item => {
      const department = sheetDepartments.find(d => d.number === item.departmentNumber);

      const town = this.townRepository.create({
        id: item.id,
        name: item.name,
        description: item.description,
        department: department ? { id: department.id } : undefined,
        isEnable: Boolean(item.enabled),
        location:
          item.longitude && item.latitude
            ? { type: 'Point', coordinates: [+item.longitude, +item.latitude] }
            : undefined,
      });

      const dbTown = dbTowns.find(t => t.id === town.id);
      if (!dbTown) return town;

      return this.townRepository.merge(dbTown, town);
    });

    this.logger.log('\tSaving towns...');
    await queryRunner.manager.save(Town, towns);
    this.logger.log('\tTowns saved successfully in the database');
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

  private async seedCategoriesFromWorkbook(workbook: WorkBook, queryRunner: QueryRunner) {
    this.logger.log('Creating categories...');
    const sheetCategories = this.getCategoriesFromWorkbook(workbook);
    const sheetModels = this.getModelsFromWorkbook(workbook);
    const sheetIcons = this.getIconsFromWorkbook(workbook);

    this.logger.log('\tGet all categories from the database');
    const dbCategories = await this.categoryRepository.find();
    this.logger.log(`\tCategories found: ${dbCategories.length}`);

    const categories: Category[] = sheetCategories.map(item => {
      const icon = sheetIcons.find(i => i.name.toLocaleLowerCase() === item.icon?.toLocaleLowerCase());
      const modelsIds: string[] =
        item.models
          ?.split(',')
          .map(m => m.trim())
          .map(modelSlug => {
            const modelFound = sheetModels.find(m => m.slug.toLocaleLowerCase() === modelSlug.toLocaleLowerCase());
            return modelFound ? modelFound.id : null;
          })
          .filter(id => id !== null) || [];

      const category = this.categoryRepository.create({
        id: item.id,
        name: item.name,
        slug: item.slug,
        icon: icon ? { id: icon.id } : undefined,
        models: modelsIds.map(id => ({ id })),
        isEnabled: true,
      });

      const dbCategory = dbCategories.find(c => c.id === category.id);
      if (!dbCategory) return category;

      return this.categoryRepository.merge(dbCategory, category);
    });

    this.logger.log('\tSaving categories...');
    await queryRunner.manager.save(Category, categories);
    this.logger.log('\tCategories saved successfully in the database');
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

  private async seedFacilitiesFromWorkbook(workbook: WorkBook, queryRunner: QueryRunner) {
    this.logger.log('Creating facilities...');
    const sheetFacilities = this.getFacilitiesFromWorkbook(workbook);
    const sheetModels = this.getModelsFromWorkbook(workbook);

    this.logger.log('\tGet all facilities from the database');
    const dbFacilities = await this.facilityRepository.find();
    this.logger.log(`\tFacilities found: ${dbFacilities.length}`);

    const facilities: Facility[] = sheetFacilities.map(item => {
      const modelsIds: string[] =
        item.models
          ?.split(',')
          .map(m => m.trim())
          .map(modelSlug => {
            const modelFound = sheetModels.find(m => m.slug.toLocaleLowerCase() === modelSlug.toLocaleLowerCase());
            return modelFound ? modelFound.id : null;
          })
          .filter(id => id !== null) || [];

      const facility = this.facilityRepository.create({
        id: item.id,
        name: item.name,
        slug: item.slug,
        models: modelsIds.map(id => ({ id })),
        isEnabled: true,
      });

      const dbFacility = dbFacilities.find(f => f.id === facility.id);
      if (!dbFacility) return facility;

      return this.facilityRepository.merge(dbFacility, facility);
    });

    this.logger.log('\tSaving facilities...');
    await queryRunner.manager.save(Facility, facilities);
    this.logger.log('\tFacilities saved successfully in the database');
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
      'internalRecommendations',
      'temperature',
    ];

    const sheet = workbook.Sheets[FileSheetsEnum.places];
    const json = utils.sheet_to_json<SheetPlace>(sheet, { header: headers, range: 1 });

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

    const places: SheetPlace[] = [];
    const baseFolder = 'banco-de-imagenes/places';

    for (const sheetPlace of sheetPlaces) {
      const url = `${baseFolder}/${sheetPlace.cloudinaryFolder.trim()}`;
      const res = await this.cloudinaryService.getResourceFromFolder(url);
      if (!res || (res.resources.length as number) === 0) continue;

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

  private async seedPlacesFromWorkbook({ workbook, queryRunner, onAddTempImage, onDeleteImage }: SeedPlaceProps) {
    this.writeLog('Creating places...');

    const placesData = await this.getPlacesFromWorkbook(workbook);
    const categoriesData = this.getCategoriesFromWorkbook(workbook);
    const facilitiesData = this.getFacilitiesFromWorkbook(workbook);
    const townsData = this.getTownsFromWorkbook(workbook);

    this.writeLog(`Records of file: ${placeListData.length}`, 1);

    this.writeLog('Get all places from database', 1);
    const dbPlaces = await this.placeRepository.find({
      relations: { categories: true, facilities: true, images: { imageResource: true } },
    });
    this.writeLog(`Places found: ${dbPlaces.length}`, 2);

    for (const placeData of placesData) {
      this.writeLog(`Creating place ${placeData.name}`, 1);
      // * Check if the place already exists
      const existingPlace = dbPlaces.find(p => p.id === placeData.id);
      if (existingPlace) this.writeLog('The place already exists', 2);

      // * Get the category ids using the category names
      const placeCategories =
        placeData.category
          ?.split(',')
          .map(c => c.trim().toLocaleLowerCase())
          .map(identifier => {
            const category = categoriesData.find(
              c => c.name.toLocaleLowerCase() === identifier || c.slug === identifier,
            );
            return category ?? null;
          })
          .filter(c => c !== null) || [];

      if (placeCategories.length === 0) this.writeLog('No category found', 2);
      else this.writeLog(`Place categories: ${placeCategories.map(c => c.name).join(', ')}`, 2);

      // * Get the facility ids using the facility names
      const facilitiesIds =
        placeData.facilities
          ?.split(',')
          .map(f => f.trim().toLocaleLowerCase())
          .map(identifier =>
            facilitiesData.find(f => f.name.toLocaleLowerCase() === identifier || f.slug === identifier),
          )
          .filter(f => f !== undefined) || [];

      if (facilitiesIds.length === 0) this.writeLog('No facility found', 2);
      else this.writeLog(`Place facilities: ${facilitiesIds.map(f => f.name).join(', ')}`, 2);

      // * Get the town id using the town name
      const town = townsData.find(t => t.name.toLocaleLowerCase() === placeData.town.toLocaleLowerCase());
      if (!town) this.writeLog('No town found', 2);
      else this.writeLog(`Place town: ${town.name}`, 2);

      // * Create the place object with the data from the sheet
      const newPlace = this.placeRepository.create({
        id: placeData.id,
        name: placeData.name,
        slug: placeData.slug,
        description: placeData.description,
        difficultyLevel: placeData.difficulty,
        points: placeData.points,
        location: { type: 'Point', coordinates: [+placeData.longitude, +placeData.latitude] },
        urbarCenterDistance: placeData.distance,
        googleMapsUrl: placeData.googleMapsLink,
        temperature: placeData.temperature ? +placeData.temperature : undefined,
        maxDepth: placeData.maxDeep,
        altitude: placeData.altitude,
        capacity: placeData.capacity,
        minAge: placeData.minAge,
        maxAge: placeData.maxAge,
        howToGetThere: placeData.howToGetThere,
        transportReference: placeData.transportReference,
        arrivalReference: placeData.arrivalReference,
        recommendations: placeData.recomendations?.split('&').join('\n -'),
        howToDress: placeData.howToDress,
        observations: placeData.internalRecommendations,
        town: town ? { id: town.id } : undefined,
        categories: placeCategories.map(c => ({ id: c.id })),
        facilities: facilitiesIds.map(f => ({ id: f.id })),
      });

      // * Save the place in the database with only the data from the sheet witout images
      this.writeLog('Save place in the database with sheet data', 2);
      const place = existingPlace ? this.placeRepository.merge(existingPlace, newPlace) : newPlace;
      await queryRunner.manager.save(Place, place);

      // * Remove old images and save the new ones
      this.writeLog(`Remove old images...`, 2);
      if (place.images) {
        place.images.forEach(({ imageResource }) => {
          if (imageResource.publicId) onDeleteImage(imageResource.publicId);
        });
        await Promise.all(place.images.map(image => queryRunner.manager.remove(image)));
      }

      this.writeLog(`Save new images...`, 2);
      const cloudinaryRes = await Promise.all(
        placeData.images.map(url =>
          this.cloudinaryService.uploadImageFromUrl(url, `${place.name}`, CloudinaryPresets.PLACE_PHOTO),
        ),
      );

      this.writeLog(`Save ${cloudinaryRes.length} images in cloudinary!`, 2);

      const images = cloudinaryRes
        .filter(res => typeof res !== 'undefined')
        .map(res => {
          onAddTempImage(res.publicId);
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

      this.writeLog(`Save ${images.length} images resource in the database...`, 2);
      await queryRunner.manager.save(ImageResource, images);

      // * Save the images in the database and add ID to global array
      this.writeLog(`Add image to place and updating...`, 2);
      const placeImages = images.map((image, index) => {
        return this.placeImageRepository.create({ imageResource: image, order: index + 1, place: { id: place.id } });
      });

      await queryRunner.manager.save(PlaceImage, placeImages);
    }
  }

  private writeLog(message: string, level = 0) {
    const tabs = '  '.repeat(level);
    this.logger.log(`${tabs}${message}`);
  }
}
