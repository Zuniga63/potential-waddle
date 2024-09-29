import { Socket } from 'socket.io';
import { DataSource, QueryRunner } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';

import { SeedsGateway } from './seeds.gateway';
import { User } from '../users/entities/user.entity';
import { Department, Town } from '../towns/entities';
import { UsersService } from '../users/users.service';
import { SeedWorkbook, truncateTables } from './logic';
import { Place, PlaceImage } from '../places/entities';
import { FileSheetsEnum } from './enums/file-sheets.enum';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Restaurant, RestaurantImage } from '../restaurants/entities';
import { Experience, ExperienceImage } from '../experiences/entities';
import { matchCategoriesByValue, matchFacilitiesByValue } from './utils';
import { Lodging, LodgingImage } from '../lodgings/entities';
import { AppIcon, Category, Facility, ImageResource, Language, Model } from '../core/entities';
import { BANK_IMAGE_FOLDER, FOLDERS_IMAGE_BANK } from './constants';

interface SeedMainEntityProps {
  workbook: SeedWorkbook;
  queryRunner: QueryRunner;
  createOrRecreateImages?: boolean;
  addTempImage: (id: string) => void;
  addImageToDelete: (id: string) => void;
}

interface SeedFromFileProps {
  file: Express.Multer.File;
  truncate?: boolean;
  collection?: FileSheetsEnum;
  omitImages?: boolean;
}

interface ConnectedClient {
  [id: string]: { socked: Socket; user: User | null };
}

@Injectable()
export class SeedsService {
  private readonly logger = new Logger('SeedsService');
  private connectedClients: ConnectedClient = {};

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly cloudinaryService: CloudinaryService,

    @Inject(forwardRef(() => SeedsGateway))
    private readonly seedsWS: SeedsGateway,

    private readonly usersService: UsersService,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * WEB SOCKETS
  // * ----------------------------------------------------------------------------------------------------------------
  async registerClient({ client, userId }: { client: Socket; userId: string }) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new Error('User not found');

    this.connectedClients[client.id] = { socked: client, user };
  }

  unregisterClient(client: Socket) {
    delete this.connectedClients[client.id];
  }

  getConnectedClients(): string[] {
    // Envío el nombre de los usarios en connectedClients sin duplicar usando el email
    const users: string[] = [];
    const emails: string[] = [];

    for (const id in this.connectedClients) {
      const { user } = this.connectedClients[id];
      if (!user || emails.includes(user.email)) continue;

      users.push(user.username);
      emails.push(user.email);
    }

    return users;
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE SECTION
  // * ----------------------------------------------------------------------------------------------------------------
  async truncateAllData() {
    const logger = this.seedsWS.sendSeedLog.bind(this.seedsWS);
    this.seedsWS.sendSeedLog('Start truncating all data...');

    const imagesToDelete: string[] = [];
    const addImageToDelete = (id: string) => imagesToDelete.push(id);

    this.seedsWS.sendSeedLog('Creating query runner and connect...', 1);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await truncateTables({ queryRunner, addImageToDelete, logger, level: 1 });

      this.seedsWS.sendSeedLog('Save changes in the database...', 1);
      await queryRunner.commitTransaction();
      this.seedsWS.sendSeedLog('All changes have been truncated successfully');

      await this.deleteImagesInBatches(imagesToDelete);
    } catch (error) {
      this.logger.error(error.message);
      await queryRunner.rollbackTransaction();

      this.logger.log('Error Details');
      console.log(error);
    } finally {
      await queryRunner.release();
    }

    return 'All data has been truncated successfully';
  }

  private async deleteImagesInBatches(publicIds: string[]) {
    if (publicIds.length === 0) return;

    this.seedsWS.sendSeedLog(`Clear Cloudinary images [${publicIds.length}]...`, 1);

    const batchSize = 10;

    for (let i = 0; i < publicIds.length; i += batchSize) {
      const count = Math.min(batchSize, publicIds.length - i);
      this.seedsWS.sendSeedLog(`Deleting batch ${i + 1} to ${i + count}...`, 2);
      const batch = publicIds.slice(i, i + batchSize);
      await Promise.all(batch.map(id => this.cloudinaryService.destroyFile(id)));
    }

    this.seedsWS.sendSeedLog('All images have been destroyed successfully', 1);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED AREA
  // * ----------------------------------------------------------------------------------------------------------------
  async seedFromFile({ file, truncate, collection, omitImages }: SeedFromFileProps) {
    this.seedsWS.sendSeedLog('Start seeding from file...');
    const logger = this.seedsWS.sendSeedLog.bind(this.seedsWS);

    const imagesToDelete: string[] = [];
    const tempImages: string[] = [];
    const createOrRecreateImages = Boolean(truncate || !omitImages);

    const addImageToDelete = (id: string) => imagesToDelete.push(id);
    const addTempImage = (id: string) => tempImages.push(id);

    // this.writeLog('Creating workbook...');
    this.seedsWS.sendSeedLog('Creating workbook...', 1);
    const workbook = new SeedWorkbook(file);

    // this.writeLog('Creating query runner and connect...');
    this.seedsWS.sendSeedLog('Creating query runner and connect...', 1);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // * Truncate all tables
      if (truncate && !collection) await truncateTables({ queryRunner, addImageToDelete, logger, level: 1 });

      // * SEED ICONS
      if (!collection || collection === FileSheetsEnum.icons) await this.seedIconsFromWorkbook(workbook, queryRunner);

      // * SEED LANGUAGES
      if (!collection || collection === FileSheetsEnum.languages)
        await this.seedLanguagesFromWorkbook(workbook, queryRunner);

      // * SEED DEPARTMENTS
      if (!collection || collection === FileSheetsEnum.departments)
        await this.seedDepartmentsFromWorkbook(workbook, queryRunner);

      // * SEED TOWNS
      if (!collection || collection === FileSheetsEnum.towns) await this.seedTownsFromWorkbook(workbook, queryRunner);

      // * SEED MODELS
      if (!collection || collection === FileSheetsEnum.models) await this.seedModelFromWorkbook(workbook, queryRunner);

      // * SEED CATEGORIES
      if (!collection || collection === FileSheetsEnum.categories)
        await this.seedCategoriesFromWorkbook(workbook, queryRunner);

      // * SEED FACILITIES
      if (!collection || collection === FileSheetsEnum.facilities)
        await this.seedFacilitiesFromWorkbook(workbook, queryRunner);

      // * SEED PLACES
      if (!collection || collection === FileSheetsEnum.places) {
        await this.seedPlacesFromWorkbook({
          workbook,
          queryRunner,
          createOrRecreateImages,
          addTempImage,
          addImageToDelete,
        });
      }

      // * SEED LODGINGS
      if (!collection || collection === FileSheetsEnum.lodgings) {
        await this.seedLodgingsFromWorkbook({
          workbook,
          queryRunner,
          createOrRecreateImages,
          addTempImage,
          addImageToDelete,
        });
      }

      // * SEED EXPERIENCES
      if (!collection || collection === FileSheetsEnum.experiences) {
        await this.seedExperiencesFromWorkbook({
          workbook,
          queryRunner,
          createOrRecreateImages,
          addTempImage,
          addImageToDelete,
        });
      }

      // * SEED RESTAURANTS
      if (!collection || collection === FileSheetsEnum.restaurants) {
        await this.seedRestaurantsFromWorkbook({
          workbook,
          queryRunner,
          createOrRecreateImages,
          addTempImage,
          addImageToDelete,
        });
      }

      // this.writeLog('Save changes in the database...');
      this.seedsWS.sendSeedLog('Save changes in the database...', 1);
      await queryRunner.commitTransaction();
      // this.writeLog('All changes have been saved successfully');
      this.seedsWS.sendSeedLog('All changes have been saved successfully', 1);

      await this.deleteImagesInBatches(imagesToDelete);
    } catch (error) {
      this.logger.error(error.message);
      await queryRunner.rollbackTransaction();

      await this.deleteImagesInBatches(tempImages);

      this.seedsWS.sendSeedLog('Seed Error', 1);
      this.logger.log('Error Details');
      console.log(error);
    } finally {
      await queryRunner.release();
    }

    this.seedsWS.sendSeedLog('End seeding from file...');

    return 'The seed has been created successfully';
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED ICONS
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedIconsFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.seedsWS.sendSeedLog('Creating icons...', 1);
    const sheetIcons = workbook.getIcons();

    this.seedsWS.sendSeedLog('Get all icons from the database', 2);
    const dbIcons = await queryRunner.manager.find(AppIcon, {});
    this.seedsWS.sendSeedLog(`DB Icons: ${dbIcons.length}`, 3);
    this.seedsWS.sendSeedLog(`File Icons: ${sheetIcons.length}`, 3);

    const icons: AppIcon[] = sheetIcons.map(item => {
      const icon = queryRunner.manager.create(AppIcon, { id: item.id, name: item.name, code: item.code });
      const dbIcon = dbIcons.find(i => i.id === icon.id);
      if (!dbIcon) return icon;

      return queryRunner.manager.merge(AppIcon, dbIcon, icon);
    });

    this.seedsWS.sendSeedLog('Saving icons...', 2);
    await queryRunner.manager.save(AppIcon, icons);
    this.seedsWS.sendSeedLog('Icons saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED LANGUAGES
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedLanguagesFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.seedsWS.sendSeedLog('Creating languages...', 1);
    const sheetLanguages = workbook.getLanguages();

    this.seedsWS.sendSeedLog('Get all languages from the database', 2);
    const dbLanguages = await queryRunner.manager.find(Language, {});
    this.seedsWS.sendSeedLog(`DB Languages: ${dbLanguages.length}`, 3);
    this.seedsWS.sendSeedLog(`File Languages: ${sheetLanguages.length}`, 3);

    const languages: Language[] = sheetLanguages.map(item => {
      const language = queryRunner.manager.create(Language, { id: item.id, name: item.name, code: item.code });
      const dbLanguage = dbLanguages.find(l => l.id === language.id);
      if (!dbLanguage) return language;

      return queryRunner.manager.merge(Language, dbLanguage, language);
    });

    this.seedsWS.sendSeedLog('Saving languages...', 2);
    await queryRunner.manager.save(Language, languages);
    this.seedsWS.sendSeedLog('Languages saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED MODELS
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedModelFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.seedsWS.sendSeedLog('Creating models...', 1);
    const sheetModel = workbook.getModels();

    this.seedsWS.sendSeedLog('Get all models from the database', 2);
    const dbModels = await queryRunner.manager.find(Model, {});
    this.seedsWS.sendSeedLog(`Models found: ${dbModels.length}`, 3);
    this.seedsWS.sendSeedLog(`File Models: ${sheetModel.length}`, 3);

    const models: Model[] = sheetModel.map(item => {
      const model = queryRunner.manager.create(Model, { id: item.id, name: item.name, slug: item.slug });
      const dbModel = dbModels.find(m => m.id === model.id);
      if (!dbModel) return model;

      return queryRunner.manager.merge(Model, dbModel, model);
    });

    this.seedsWS.sendSeedLog('Saving models...', 2);
    await queryRunner.manager.save(Model, models);
    this.seedsWS.sendSeedLog('Models saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED DEPARTMENTS
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedDepartmentsFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.seedsWS.sendSeedLog('Creating departments...', 1);
    const sheetDepartments = workbook.getDepartments();

    this.seedsWS.sendSeedLog('Get all departments from the database', 2);
    const dbDepartments = await queryRunner.manager.find(Department, {});
    this.seedsWS.sendSeedLog(`Departments found: ${dbDepartments.length}`, 3);
    this.seedsWS.sendSeedLog(`File Departments: ${sheetDepartments.length}`, 3);

    const departments: Department[] = sheetDepartments.map(item => {
      const department = queryRunner.manager.create(Department, {
        id: item.id,
        name: item.name,
        capital: item.capital,
      });
      const dbDepartment = dbDepartments.find(d => d.id === department.id);
      if (!dbDepartment) return department;

      return queryRunner.manager.merge(Department, dbDepartment, department);
    });

    this.seedsWS.sendSeedLog('Saving departments...', 2);
    await queryRunner.manager.save(Department, departments);
    this.seedsWS.sendSeedLog('Departments saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED TOWNS
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedTownsFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.seedsWS.sendSeedLog('Creating towns: This module use departments of file sheet', 1);
    const sheetTowns = workbook.getTowns();
    const sheetDepartments = workbook.getDepartments();

    this.seedsWS.sendSeedLog('Get all towns from the database', 2);
    const dbTowns = await queryRunner.manager.find(Town, {});
    this.seedsWS.sendSeedLog(`Towns DB: ${dbTowns.length}`, 3);
    this.seedsWS.sendSeedLog(`File Towns: ${sheetTowns.length}`, 3);

    const towns: Town[] = sheetTowns.map(item => {
      const department = sheetDepartments.find(d => d.number === item.departmentNumber);

      const town = queryRunner.manager.create(Town, {
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

      return queryRunner.manager.merge(Town, dbTown, town);
    });

    this.seedsWS.sendSeedLog('Saving towns...', 2);
    await queryRunner.manager.save(Town, towns);
    this.seedsWS.sendSeedLog('Towns saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED CATEGORIES
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedCategoriesFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.seedsWS.sendSeedLog('Creating categories: For create caegoría require models and icons', 1);
    const sheetCategories = workbook.getCategories();
    const sheetModels = workbook.getModels();
    const sheetIcons = workbook.getIcons();

    this.seedsWS.sendSeedLog('Get all categories from the database', 2);
    const dbCategories = await queryRunner.manager.find(Category, {});
    this.seedsWS.sendSeedLog(`Categories DB: ${dbCategories.length}`, 3);
    this.seedsWS.sendSeedLog(`File Categories: ${sheetCategories.length}`, 3);
    this.seedsWS.sendSeedLog(`File Models: ${sheetModels.length}`, 3);
    this.seedsWS.sendSeedLog(`File Icons: ${sheetIcons.length}`, 3);

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

      const category = queryRunner.manager.create(Category, {
        id: item.id,
        name: item.name,
        slug: item.slug,
        icon: icon ? { id: icon.id } : undefined,
        models: modelsIds.map(id => ({ id })),
        isEnabled: true,
      });

      const dbCategory = dbCategories.find(c => c.id === category.id);
      if (!dbCategory) return category;

      return queryRunner.manager.merge(Category, dbCategory, category);
    });

    this.seedsWS.sendSeedLog('Saving categories...', 2);
    await queryRunner.manager.save(Category, categories);
    this.seedsWS.sendSeedLog('Categories saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED FACILITIES
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedFacilitiesFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.seedsWS.sendSeedLog('Creating facilities: This seed require models, icons is not avaliable', 1);
    const sheetFacilities = workbook.getFacilities();
    const sheetModels = workbook.getModels();

    this.seedsWS.sendSeedLog('Get all facilities from the database', 2);
    const dbFacilities = await queryRunner.manager.find(Facility, {});
    this.seedsWS.sendSeedLog(`Facilities DB: ${dbFacilities.length}`, 3);
    this.seedsWS.sendSeedLog(`File Facilities: ${sheetFacilities.length}`, 3);
    this.seedsWS.sendSeedLog(`File Models: ${sheetModels.length}`, 3);

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

      const facility = queryRunner.manager.create(Facility, {
        id: item.id,
        name: item.name,
        slug: item.slug,
        models: modelsIds.map(id => ({ id })),
        isEnabled: true,
      });

      const dbFacility = dbFacilities.find(f => f.id === facility.id);
      if (!dbFacility) return facility;

      return queryRunner.manager.merge(Facility, dbFacility, facility);
    });

    this.seedsWS.sendSeedLog('Saving facilities...', 2);
    await queryRunner.manager.save(Facility, facilities);
    this.seedsWS.sendSeedLog('Facilities saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED PLACES
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedPlacesFromWorkbook({
    workbook,
    queryRunner,
    addImageToDelete,
    addTempImage,
    createOrRecreateImages = true,
  }: SeedMainEntityProps) {
    this.seedsWS.sendSeedLog('Creating places: For seed place require categories, facilities and towns', 1);

    const placesData = workbook.getPlaces();
    const categoriesData = workbook.getCategories();
    const facilitiesData = workbook.getFacilities();
    const townsData = workbook.getTowns();

    this.seedsWS.sendSeedLog('Get all places from database', 2);
    const dbPlaces = await queryRunner.manager.find(Place, {
      relations: { categories: true, facilities: true, images: { imageResource: true } },
    });
    this.seedsWS.sendSeedLog(`Place DB: ${dbPlaces.length}`, 3);
    this.seedsWS.sendSeedLog(`File Place: ${placesData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Categories: ${categoriesData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Facilities: ${facilitiesData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Towns: ${townsData.length}`, 3);

    for (const placeData of placesData) {
      this.seedsWS.sendSeedLog(`Processing place ${placeData.name}`, 2);

      const existingPlace = dbPlaces.find(p => p.id === placeData.id);
      if (existingPlace) this.seedsWS.sendSeedLog('The place already exists', 3);

      this.seedsWS.sendSeedLog(`Recover images from cloudinary`, 3);
      const folderImages = await this.getImagesFromFolder(placeData.cloudinaryFolder, 'places');
      this.seedsWS.sendSeedLog(`Images found: ${folderImages.length}`, 4);

      if (folderImages.length === 0 && (!existingPlace || createOrRecreateImages)) {
        this.seedsWS.sendSeedLog('No images found, continue with the next place', 3);
        continue;
      }

      // * Get the category ids using the category names
      const placeCategories = matchCategoriesByValue({ value: placeData.category, categories: categoriesData });
      if (placeCategories.length === 0) this.seedsWS.sendSeedLog('No category found', 3);
      else this.seedsWS.sendSeedLog(`Place categories: ${placeCategories.map(c => c.name).join(', ')}`, 3);

      // * Get the facility ids using the facility names
      const facilities = matchFacilitiesByValue({ value: placeData.facilities, facilities: facilitiesData });
      if (facilities.length === 0) this.seedsWS.sendSeedLog('No facility found', 3);
      else this.seedsWS.sendSeedLog(`Place facilities: ${facilities.map(f => f.name).join(', ')}`, 3);

      // * Get the town id using the town name
      const town = townsData.find(t => t.name.toLocaleLowerCase() === placeData.town.toLocaleLowerCase());
      if (!town) this.seedsWS.sendSeedLog('No town found', 3);
      else this.seedsWS.sendSeedLog(`Place town: ${town.name}`, 3);

      // * Create the place object with the data from the sheet
      const newPlace = queryRunner.manager.create(Place, {
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
        recommendations: placeData.recomendations,
        howToDress: placeData.howToDress,
        observations: placeData.internalRecommendations,
        town: town ? { id: town.id } : undefined,
        categories: placeCategories.map(c => ({ id: c.id })),
        facilities: facilities.map(f => ({ id: f.id })),
      });

      // * Save the place in the database with only the data from the sheet without images
      this.seedsWS.sendSeedLog('Save place in the database with sheet data', 3);
      const place = existingPlace ? queryRunner.manager.merge(Place, existingPlace, newPlace) : newPlace;
      await queryRunner.manager.save(Place, place);

      if (createOrRecreateImages || !existingPlace) {
        // * Remove old images and save the new ones
        this.seedsWS.sendSeedLog(`Remove old images...`, 3);
        if (place.images) {
          const promises: Promise<any>[] = [];
          place.images.forEach(image => {
            const { imageResource } = image;
            if (imageResource && imageResource.publicId) addImageToDelete(imageResource.publicId);
            promises.push(queryRunner.manager.remove(image));
          });
          await Promise.all(promises);
        }

        this.seedsWS.sendSeedLog(`Save images...`, 3);
        const cloudinaryRes = await Promise.all(
          folderImages.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, `${place.name}`, CloudinaryPresets.PLACE_IMAGE),
          ),
        );

        this.seedsWS.sendSeedLog(`Save ${cloudinaryRes.length} images in cloudinary!`, 3);

        const imageResources = cloudinaryRes
          .filter(res => typeof res !== 'undefined')
          .map(res => {
            addTempImage(res.publicId);
            return queryRunner.manager.create(ImageResource, {
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

        this.seedsWS.sendSeedLog(`Save ${imageResources.length} images resource in the database...`, 3);
        await queryRunner.manager.save(ImageResource, imageResources);

        // * Save the images in the database and add ID to global array
        this.seedsWS.sendSeedLog(`Add image to place and updating...`, 3);
        const placeImages = imageResources.map((image, index) => {
          return queryRunner.manager.create(PlaceImage, {
            imageResource: image,
            order: index + 1,
            place: { id: place.id },
          });
        });

        await queryRunner.manager.save(PlaceImage, placeImages);
      }
    }

    this.seedsWS.sendSeedLog('Places saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED LODGINGS
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedLodgingsFromWorkbook({
    workbook,
    queryRunner,
    addImageToDelete,
    addTempImage,
    createOrRecreateImages,
  }: SeedMainEntityProps) {
    this.seedsWS.sendSeedLog('Creating lodgings: this seed require categories, facilities and town', 1);

    const lodgingsData = workbook.getLodgings();
    const categoriesData = workbook.getCategories();
    const facilitiesData = workbook.getFacilities();
    const townsData = workbook.getTowns();

    this.seedsWS.sendSeedLog(`Records of file: ${lodgingsData.length}`, 2);

    this.seedsWS.sendSeedLog('Get all lodgings from database', 2);
    const dbLodgings = await queryRunner.manager.find(Lodging, {
      relations: { categories: true, facilities: true, images: { imageResource: true } },
    });
    this.seedsWS.sendSeedLog(`DB lodging found: ${dbLodgings.length}`, 3);
    this.seedsWS.sendSeedLog(`File Lodgings: ${lodgingsData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Categories: ${categoriesData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Facilities: ${facilitiesData.length}`, 3);

    for (const lodgingData of lodgingsData) {
      this.seedsWS.sendSeedLog(`Processing lodging ${lodgingData.name}`, 2);

      const existingLodging = dbLodgings.find(l => l.id === lodgingData.id);
      if (existingLodging) this.seedsWS.sendSeedLog('The lodging already exists', 3);

      this.seedsWS.sendSeedLog(`Recover images from cloudinary`, 3);
      const folderImages = await this.getImagesFromFolder(lodgingData.slug, 'lodgings');
      this.seedsWS.sendSeedLog(`Images found: ${folderImages.length}`, 4);

      if (folderImages.length === 0 && (!existingLodging || createOrRecreateImages)) {
        this.seedsWS.sendSeedLog('No images found, continue with the next lodging', 4);
        continue;
      }

      // * Get the category ids using the category names
      const lodgingCategories = matchCategoriesByValue({ value: lodgingData.categories, categories: categoriesData });
      if (lodgingCategories.length === 0) this.seedsWS.sendSeedLog('No category found', 3);
      else this.seedsWS.sendSeedLog(`Lodging categories: ${lodgingCategories.map(c => c.name).join(', ')}`, 3);

      // * Get the facility ids using the facility names
      const facilities = matchFacilitiesByValue({ value: lodgingData.facilities, facilities: facilitiesData });
      if (facilities.length === 0) this.seedsWS.sendSeedLog('No facility found', 3);
      else this.seedsWS.sendSeedLog(`Lodging facilities: ${facilities.map(f => f.name).join(', ')}`, 3);

      // * Get the town id using the town name
      const town = townsData.find(t => t.name.toLocaleLowerCase() === lodgingData.town.toLocaleLowerCase());
      if (!town) this.seedsWS.sendSeedLog('No town found', 3);
      else this.seedsWS.sendSeedLog(`Lodging town: ${town.name}`, 3);

      const newLodging = queryRunner.manager.create(Lodging, {
        id: lodgingData.id,
        name: lodgingData.name,
        slug: lodgingData.slug,
        description: lodgingData.description,
        roomTypes: lodgingData.roomTypes?.split(',').map(r => r.trim()),
        roomCount: +lodgingData.roomCount,
        lowestPrice: lodgingData.lowestPrice ? +lodgingData.lowestPrice : undefined,
        highestPrice: lodgingData.highestPrice ? +lodgingData.highestPrice : undefined,
        // ------------------------------------------------
        address: lodgingData.address,
        phoneNumbers: lodgingData.phones?.split(',').map(p => p.trim()),
        email: lodgingData.email,
        website: lodgingData.website,
        facebook: lodgingData.facebook,
        instagram: lodgingData.instagram,
        whatsappNumbers: lodgingData.whatsapps?.split(',').map(w => w.trim()),
        openingHours: lodgingData.openingHours?.split(',').map(o => o.trim()),
        spokenLangueges: lodgingData.languages?.split(',').map(l => l.trim()),
        // ------------------------------------------------
        location: { type: 'Point', coordinates: [+lodgingData.longitude, +lodgingData.latitude] },
        googleMapsUrl: lodgingData.googleMaps,
        urbanCenterDistance: lodgingData.distance,
        howToGetThere: lodgingData.howToGetThere,
        arrivalReference: lodgingData.zone,
        // ------------------------------------------------
        isPublic: true,
        town: town ? { id: town.id } : undefined,
        categories: lodgingCategories.map(c => ({ id: c.id })),
        facilities: facilities.map(f => ({ id: f.id })),
      });

      // * Save the lodging in the database with only the data from the sheet without images
      this.seedsWS.sendSeedLog('Save lodging in the database with sheet data', 3);
      const lodging = existingLodging ? queryRunner.manager.merge(Lodging, existingLodging, newLodging) : newLodging;
      await queryRunner.manager.save(Lodging, lodging);

      // * Create the lodging object with the data from the sheet

      if (createOrRecreateImages || !existingLodging) {
        // * Remove old images and save the new ones
        this.seedsWS.sendSeedLog(`Remove old images...`, 3);
        if (lodging.images) {
          const promises: Promise<any>[] = [];
          lodging.images.forEach(image => {
            const { imageResource } = image;
            if (imageResource && imageResource.publicId) addImageToDelete(imageResource.publicId);
            promises.push(queryRunner.manager.remove(image));
          });
          await Promise.all(promises);
        }

        this.seedsWS.sendSeedLog(`Save images...`, 3);
        const cloudinaryRes = await Promise.all(
          folderImages.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, `${lodging.name}`, CloudinaryPresets.LODGING_IMAGE),
          ),
        );

        this.seedsWS.sendSeedLog(`Save ${cloudinaryRes.length} images in cloudinary!`, 3);

        const imageResources = cloudinaryRes
          .filter(res => typeof res !== 'undefined')
          .map(res => {
            addTempImage(res.publicId);
            return queryRunner.manager.create(ImageResource, {
              publicId: res.publicId,
              url: res.url,
              fileName: lodging.name,
              width: res.width,
              height: res.height,
              format: res.format,
              resourceType: res.type,
              provider: ResourceProvider.Cloudinary,
            });
          });

        this.seedsWS.sendSeedLog(`Save ${imageResources.length} images resource in the database...`, 3);
        await queryRunner.manager.save(ImageResource, imageResources);

        // * Save the images in the database and add ID to global array
        this.seedsWS.sendSeedLog(`Add image to lodging and updating...`, 3);
        const lodgingImages = imageResources.map((image, index) => {
          return queryRunner.manager.create(LodgingImage, {
            imageResource: image,
            order: index + 1,
            lodging: { id: lodging.id },
          });
        });

        await queryRunner.manager.save(LodgingImage, lodgingImages);
      }
    }

    this.seedsWS.sendSeedLog('Lodgings saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED EXPERIENCE
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedExperiencesFromWorkbook({
    workbook,
    queryRunner,
    addImageToDelete,
    addTempImage,
    createOrRecreateImages,
  }: SeedMainEntityProps) {
    this.seedsWS.sendSeedLog('Creating experiences: this seed require categories, facilities and town', 1);
    const experiencesData = workbook.getExperiences();
    const categoriesData = workbook.getCategories();
    const facilitiesData = workbook.getFacilities();
    const townsData = workbook.getTowns();

    this.seedsWS.sendSeedLog('Get experiences from database', 2);
    const dbExperiences = await queryRunner.manager.find(Experience, {
      relations: { categories: true, facilities: true, images: { imageResource: true } },
    });

    this.seedsWS.sendSeedLog(`DB experiences found: ${dbExperiences.length}`, 3);
    this.seedsWS.sendSeedLog(`File experiences: ${experiencesData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Categories: ${categoriesData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Facilities: ${facilitiesData.length}`, 3);

    for (const experienceData of experiencesData) {
      this.seedsWS.sendSeedLog(`Processing experience ${experienceData.title}`, 2);

      const existingExperience = dbExperiences.find(e => e.id === experienceData.id);
      if (existingExperience) this.seedsWS.sendSeedLog('The experience already exists', 3);

      this.seedsWS.sendSeedLog(`Recover images from cloudinary`, 3);
      const folderImages = await this.getImagesFromFolder(experienceData.slug, 'experiences');
      this.seedsWS.sendSeedLog(`Images found: ${folderImages.length}`, 4);

      if (folderImages.length === 0 && (!existingExperience || createOrRecreateImages)) {
        this.seedsWS.sendSeedLog('No images found, continue with the next experience', 4);
        continue;
      }

      // * Get the category ids using the category names
      const categories = matchCategoriesByValue({ value: experienceData.categories, categories: categoriesData });
      if (categories.length === 0) this.seedsWS.sendSeedLog('No category found', 3);
      else this.seedsWS.sendSeedLog(`Experience categories: ${categories.map(c => c.name).join(', ')}`, 3);

      // * Get the facility ids using the facility names
      const facilities = matchFacilitiesByValue({ value: experienceData.facilities, facilities: facilitiesData });
      if (facilities.length === 0) this.seedsWS.sendSeedLog('No facility found', 3);
      else this.seedsWS.sendSeedLog(`Experience facilities: ${facilities.map(f => f.name).join(', ')}`, 3);

      // * Get the town id using the town name
      const town = townsData.find(t => t.name.toLocaleLowerCase() === experienceData.town.toLocaleLowerCase());
      if (!town) this.seedsWS.sendSeedLog('No town found', 3);
      else this.seedsWS.sendSeedLog(`Experience town: ${town.name}`, 3);

      // * Create the experience object with the data from the sheet
      const newExperience = queryRunner.manager.create(Experience, {
        id: experienceData.id,
        town: town ? { id: town.id } : undefined,
        categories: categories.map(c => ({ id: c.id })),
        facilities: facilities.map(f => ({ id: f.id })),
        title: experienceData.title,
        slug: experienceData.slug,
        description: experienceData.description,
        difficultyLevel: experienceData.difficultyLevel,
        price: experienceData.price,
        departureDescription: experienceData.departureDescription,
        departureLocation: {
          type: 'Point',
          coordinates: [+experienceData.departureLongitude, +experienceData.departureLatitude],
        },
        arrivalDescription: experienceData.arrivalDescription,
        arrivalLocation: {
          type: 'Point',
          coordinates: [+experienceData.arrivalLongitude, +experienceData.arrivalLatitude],
        },
        totalDistance: experienceData.totalDistance,
        travelTime: experienceData.travelTime * 60 * 60,
        points: experienceData.points,
        minAge: experienceData.minAge,
        maxAge: experienceData.maxAge,
        minParticipants: experienceData.minParticipants,
        maxParticipants: experienceData.maxParticipants,
        recommendations: experienceData.recommendations,
        howToDress: experienceData.howToDress,
        restrictions: experienceData.restrictions,
      });

      // * Save the experience in the database with only the data from the sheet without images
      this.seedsWS.sendSeedLog('Save experience in the database with sheet data', 3);
      const experience = existingExperience
        ? queryRunner.manager.merge(Experience, existingExperience, newExperience)
        : newExperience;
      await queryRunner.manager.save(Experience, experience);

      if (createOrRecreateImages || !existingExperience) {
        // * Remove old images and save the new ones
        this.seedsWS.sendSeedLog(`Remove old images...`, 3);
        if (experience.images) {
          const promises: Promise<any>[] = [];
          experience.images.forEach(image => {
            const { imageResource } = image;
            if (imageResource && imageResource.publicId) addImageToDelete(imageResource.publicId);
            promises.push(queryRunner.manager.remove(image));
          });
          await Promise.all(promises);
        }

        this.seedsWS.sendSeedLog(`Save images...`, 3);
        const cloudinaryRes = await Promise.all(
          folderImages.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, `${experience.title}`, CloudinaryPresets.EXPERIENCE_IMAGE),
          ),
        );

        this.seedsWS.sendSeedLog(`Save ${cloudinaryRes.length} images in cloudinary!`, 3);

        const imageResources = cloudinaryRes
          .filter(res => typeof res !== 'undefined')
          .map(res => {
            addTempImage(res.publicId);
            return queryRunner.manager.create(ImageResource, {
              publicId: res.publicId,
              url: res.url,
              fileName: experience.title,
              width: res.width,
              height: res.height,
              format: res.format,
              resourceType: res.type,
              provider: ResourceProvider.Cloudinary,
            });
          });

        this.seedsWS.sendSeedLog(`Save ${imageResources.length} images resource in the database...`, 3);
        await queryRunner.manager.save(ImageResource, imageResources);

        // * Save the images in the database and add ID to global array
        this.seedsWS.sendSeedLog(`Add image to experience and updating...`, 3);
        const experienceImages = imageResources.map((image, index) => {
          return queryRunner.manager.create(ExperienceImage, {
            imageResource: image,
            order: index + 1,
            experience: { id: experience.id },
          });
        });

        await queryRunner.manager.save(ExperienceImage, experienceImages);
      } //. end if createOrRecreateImages
    } //. end for loop experiences data

    this.seedsWS.sendSeedLog('Experiences saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED RESTAURANTS
  // * ----------------------------------------------------------------------------------------------------------------
  private async seedRestaurantsFromWorkbook({
    queryRunner,
    workbook,
    addImageToDelete,
    addTempImage,
    createOrRecreateImages,
  }: SeedMainEntityProps) {
    this.seedsWS.sendSeedLog('Creating restaurants: this seed require categories, facilities and town', 1);
    // * Get the data from the workbook
    const restaurantsData = workbook.getRestaurants();
    const categoriesData = workbook.getCategories();
    const facilitiesData = workbook.getFacilities();
    const townsData = workbook.getTowns();

    // * Get all the restaurants from the database
    this.seedsWS.sendSeedLog('Get restaurants from the database', 2);
    const dbRestaurants = await queryRunner.manager.find(Restaurant, {
      relations: { categories: true, facilities: true, images: { imageResource: true } },
    });

    this.seedsWS.sendSeedLog(`DB restaurants found: ${dbRestaurants.length}`, 3);
    this.seedsWS.sendSeedLog(`File restaurants: ${restaurantsData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Categories: ${categoriesData.length}`, 3);
    this.seedsWS.sendSeedLog(`File Facilities: ${facilitiesData.length}`, 3);

    // * Process each restaurant from the workbook
    for (const restaurantData of restaurantsData) {
      this.seedsWS.sendSeedLog(`Processing restaurant ${restaurantData.name}`, 2);

      // * Check if the restaurant already exists in the database
      const existingRestaurant = dbRestaurants.find(r => r.id === restaurantData.id);
      if (existingRestaurant) this.seedsWS.sendSeedLog('The restaurant already exists', 3);

      // * Get the images from the cloudinary folder
      this.seedsWS.sendSeedLog(`Recover images from cloudinary`, 3);
      const folderImages = await this.getImagesFromFolder(restaurantData.slug, 'restaurants');
      this.seedsWS.sendSeedLog(`Images found: ${folderImages.length}`, 4);

      // * If no images found and the restaurant already exists, continue with the next restaurant
      if (folderImages.length === 0 && (!existingRestaurant || createOrRecreateImages)) {
        this.seedsWS.sendSeedLog('No images found, continue with the next restaurant', 4);
        continue;
      }

      // * Get the category ids using the category names
      const categories = matchCategoriesByValue({ value: restaurantData.categories, categories: categoriesData });
      if (categories.length === 0) this.seedsWS.sendSeedLog('No category found', 3);
      else this.seedsWS.sendSeedLog(`Restaurant categories: ${categories.map(c => c.name).join(', ')}`, 3);

      // * Get the facility ids using the facility names
      const facilities = matchFacilitiesByValue({ value: restaurantData.facilities, facilities: facilitiesData });
      if (facilities.length === 0) this.seedsWS.sendSeedLog('No facility found', 3);
      else this.seedsWS.sendSeedLog(`Restaurant facilities: ${facilities.map(f => f.name).join(', ')}`, 3);

      // * Get the town id using the town name
      const town = townsData.find(t => t.name.toLocaleLowerCase() === restaurantData.town.toLocaleLowerCase());
      if (!town) this.seedsWS.sendSeedLog('No town found', 3);
      else this.seedsWS.sendSeedLog(`Restaurant town: ${town.name}`, 3);

      // * Create the restaurant object with the data from the sheet
      const newRestaurant = queryRunner.manager.create(Restaurant, {
        id: restaurantData.id,
        town: town ? { id: town.id } : undefined,
        categories: categories.map(c => ({ id: c.id })),
        facilities: facilities.map(f => ({ id: f.id })),
        name: restaurantData.name,
        slug: restaurantData.slug,
        description: restaurantData.description,
        address: restaurantData.address,
        phoneNumbers: restaurantData.phoneNumbers?.split(',').map(p => p.trim()),
        email: restaurantData.email,
        website: restaurantData.website,
        facebook: restaurantData.facebook,
        instagram: restaurantData.instagram,
        whatsappNumbers: restaurantData.whatsappNumbers?.split(',').map(w => w.trim()),
        openingHours: restaurantData.openingHours?.split(',').map(h => h.trim()),
        spokenLanguages: restaurantData.spokenLanguages?.split(',').map(l => l.trim()),
        location: { type: 'Point', coordinates: [+restaurantData.longitude, +restaurantData.latitude] },
        googleMapsUrl: restaurantData.googleMapsUrl,
        urbanCenterDistance: restaurantData.urbanCenterDistance,
      });

      // * Save the restaurant in the database with only the data from the sheet without images
      this.seedsWS.sendSeedLog('Save restaurant in the database with sheet data', 3);
      const restaurant = existingRestaurant
        ? queryRunner.manager.merge(Restaurant, existingRestaurant, newRestaurant)
        : newRestaurant;

      await queryRunner.manager.save(Restaurant, restaurant);

      // * If createOrRecreateImages is true or the restaurant does not exist, save the images
      if (createOrRecreateImages || !existingRestaurant) {
        // * Remove old images and save the new ones
        this.seedsWS.sendSeedLog(`Remove old images...`, 3);
        if (restaurant.images) {
          const promises: Promise<any>[] = [];
          restaurant.images.forEach(image => {
            const { imageResource } = image;
            if (imageResource && imageResource.publicId) addImageToDelete(imageResource.publicId);
            promises.push(queryRunner.manager.remove(image));
          });
          await Promise.all(promises);
        }

        this.seedsWS.sendSeedLog(`Save images...`, 3);
        const cloudinaryRes = await Promise.all(
          folderImages.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, `${restaurant.name}`, CloudinaryPresets.RESTAURANT_IMAGE),
          ),
        );

        this.seedsWS.sendSeedLog(`Save ${cloudinaryRes.length} images in cloudinary!`, 3);

        const imageResources = cloudinaryRes
          .filter(res => typeof res !== 'undefined')
          .map(res => {
            addTempImage(res.publicId);
            return queryRunner.manager.create(ImageResource, {
              publicId: res.publicId,
              url: res.url,
              fileName: restaurant.name,
              width: res.width,
              height: res.height,
              format: res.format,
              resourceType: res.type,
              provider: ResourceProvider.Cloudinary,
            });
          });

        this.seedsWS.sendSeedLog(`Save ${imageResources.length} images resource in the database...`, 3);
        await queryRunner.manager.save(ImageResource, imageResources);

        // * Save the images in the database and add ID to global array
        this.seedsWS.sendSeedLog(`Add image to restaurant and updating...`, 3);
        const restaurantImages = imageResources.map((image, index) => {
          return queryRunner.manager.create(RestaurantImage, {
            imageResource: image,
            order: index + 1,
            restaurant: { id: restaurant.id },
          });
        });

        await queryRunner.manager.save(RestaurantImage, restaurantImages);
      } //. end if createOrRecreateImages
    } //. end for loop restaurants data

    this.seedsWS.sendSeedLog('Restaurants saved successfully in the database', 2);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * SEED UTILS
  // * ----------------------------------------------------------------------------------------------------------------
  private async getImagesFromFolder(folder: string, rootFolder?: keyof typeof FOLDERS_IMAGE_BANK) {
    let url = `${BANK_IMAGE_FOLDER}`;

    if (rootFolder) url += `/${FOLDERS_IMAGE_BANK[rootFolder]}`;
    url += `/${folder.trim()}`;

    const res = await this.cloudinaryService.getResourceFromFolder(url);
    if (!res || !res.resources || (res.resources.length as number) === 0) return [];

    const { resources } = res;

    const images: string[] = [];
    let mainImage: string | null = null;

    resources.forEach(resource => {
      const { secure_url, public_id, display_name } = resource;

      if (!mainImage && (public_id.includes('main') || display_name.includes('main'))) mainImage = secure_url;
      else images.push(secure_url);
    });

    if (mainImage) images.unshift(mainImage);

    return images;
  }
}
