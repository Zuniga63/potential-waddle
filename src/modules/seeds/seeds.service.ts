import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

import { Department, Town } from '../towns/entities';
import { SeedWorkbook, truncateTables } from './logic';
import { Place, PlaceImage } from '../places/entities';
import { FileSheetsEnum } from './enums/file-sheets.enum';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { matchCategoriesByValue, matchFacilitiesByValue } from './utils';
import { AppIcon, Category, Facility, ImageResource, Language, Model } from '../core/entities';
import { Lodging, LodgingFacility, LodgingImage } from '../lodgings/entities';

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
  sheet?: FileSheetsEnum;
  omitImages?: boolean;
}

@Injectable()
export class SeedsService {
  private readonly logger = new Logger('SeedsService');

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async truncateAllData() {
    this.writeLog('Start truncating all data...');

    const imagesToDelete: string[] = [];
    const addImageToDelete = (id: string) => imagesToDelete.push(id);

    this.writeLog('Creating query runner and connect...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await truncateTables({ queryRunner, addImageToDelete, logger: this.writeLog.bind(this) });

      this.writeLog('Save changes in the database...');
      await queryRunner.commitTransaction();
      this.writeLog('All changes have been truncated successfully');

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

  async seedFromFile({ file, truncate, sheet, omitImages }: SeedFromFileProps) {
    this.writeLog('Start seeding from file...');

    const imagesToDelete: string[] = [];
    const tempImages: string[] = [];
    const createOrRecreateImages = Boolean(truncate || !omitImages);

    const addImageToDelete = (id: string) => imagesToDelete.push(id);
    const addTempImage = (id: string) => tempImages.push(id);

    this.writeLog('Creating workbook...');
    const workbook = new SeedWorkbook(file);

    this.writeLog('Creating query runner and connect...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (truncate) await truncateTables({ queryRunner, addImageToDelete, logger: this.writeLog.bind(this) });

      if (!sheet || sheet === FileSheetsEnum.icons) await this.seedIconsFromWorkbook(workbook, queryRunner);
      if (!sheet || sheet === FileSheetsEnum.languages) await this.seedLanguagesFromWorkbook(workbook, queryRunner);
      if (!sheet || sheet === FileSheetsEnum.departments) await this.seedDepartmentsFromWorkbook(workbook, queryRunner);
      if (!sheet || sheet === FileSheetsEnum.towns) await this.seedTownsFromWorkbook(workbook, queryRunner);
      if (!sheet || sheet === FileSheetsEnum.models) await this.seedModelFromWorkbook(workbook, queryRunner);
      if (!sheet || sheet === FileSheetsEnum.categories) await this.seedCategoriesFromWorkbook(workbook, queryRunner);
      if (!sheet || sheet === FileSheetsEnum.facilities) await this.seedFacilitiesFromWorkbook(workbook, queryRunner);
      if (!sheet || sheet === FileSheetsEnum.places) {
        await this.seedPlacesFromWorkbook({
          workbook,
          queryRunner,
          createOrRecreateImages,
          addTempImage,
          addImageToDelete,
        });
      }

      if (!sheet || sheet === FileSheetsEnum.lodgings) {
        await this.seedLodgingsFromWorkbook({
          workbook,
          queryRunner,
          createOrRecreateImages,
          addTempImage,
          addImageToDelete,
        });
      }

      this.writeLog('Save changes in the database...');
      await queryRunner.commitTransaction();
      this.writeLog('All changes have been saved successfully');

      await this.deleteImagesInBatches(imagesToDelete);
    } catch (error) {
      this.logger.error(error.message);
      await queryRunner.rollbackTransaction();

      await this.deleteImagesInBatches(tempImages);

      this.logger.log('Error Details');
      console.log(error);
    } finally {
      await queryRunner.release();
    }

    return 'The seed has been created successfully';
  }

  private async seedIconsFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.logger.log('Creating icons...');
    const sheetIcons = workbook.getIcons();

    this.logger.log('\tGet all icons from the database');
    const dbIcons = await queryRunner.manager.find(AppIcon, {});
    this.logger.log(`\tIcons found: ${dbIcons.length}`);

    const icons: AppIcon[] = sheetIcons.map(item => {
      const icon = queryRunner.manager.create(AppIcon, { id: item.id, name: item.name, code: item.code });
      const dbIcon = dbIcons.find(i => i.id === icon.id);
      if (!dbIcon) return icon;

      return queryRunner.manager.merge(AppIcon, dbIcon, icon);
    });

    this.logger.log('\tSaving icons...');
    await queryRunner.manager.save(AppIcon, icons);
    this.logger.log('\tIcons saved successfully in the database');
  }

  private async seedLanguagesFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.logger.log('Creating languages...');
    const sheetLanguages = workbook.getLanguages();

    this.logger.log('\tGet all languages from the database');
    const dbLanguages = await queryRunner.manager.find(Language, {});
    this.logger.log(`\tLanguages found: ${dbLanguages.length}`);

    const languages: Language[] = sheetLanguages.map(item => {
      const language = queryRunner.manager.create(Language, { id: item.id, name: item.name, code: item.code });
      const dbLanguage = dbLanguages.find(l => l.id === language.id);
      if (!dbLanguage) return language;

      return queryRunner.manager.merge(Language, dbLanguage, language);
    });

    this.logger.log('\tSaving languages...');
    await queryRunner.manager.save(Language, languages);
    this.logger.log('\tLanguages saved successfully in the database');
  }

  private async seedModelFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.logger.log('Creating models...');
    const sheetModel = workbook.getModels();

    this.logger.log('\tGet all models from the database');
    const dbModels = await queryRunner.manager.find(Model, {});
    this.logger.log(`\tModels found: ${dbModels.length}`);

    const models: Model[] = sheetModel.map(item => {
      const model = queryRunner.manager.create(Model, { id: item.id, name: item.name, slug: item.slug });
      const dbModel = dbModels.find(m => m.id === model.id);
      if (!dbModel) return model;

      return queryRunner.manager.merge(Model, dbModel, model);
    });

    this.logger.log('\tSaving models...');
    await queryRunner.manager.save(Model, models);
    this.logger.log('\tModels saved successfully in the database');
  }

  private async seedDepartmentsFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.logger.log('Creating departments...');
    const sheetDepartments = workbook.getDepartments();

    this.logger.log('\tGet all departments from the database');
    const dbDepartments = await queryRunner.manager.find(Department, {});
    this.logger.log(`\tDepartments found: ${dbDepartments.length}`);

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

    this.logger.log('\tSaving departments...');
    await queryRunner.manager.save(Department, departments);
    this.logger.log('\tDepartments saved successfully in the database');
  }

  private async seedTownsFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.logger.log('Creating towns...');
    const sheetTowns = workbook.getTowns();
    const sheetDepartments = workbook.getDepartments();

    this.logger.log('\tGet all towns from the database');
    const dbTowns = await queryRunner.manager.find(Town, {});
    this.logger.log(`\tTowns found: ${dbTowns.length}`);

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

    this.logger.log('\tSaving towns...');
    await queryRunner.manager.save(Town, towns);
    this.logger.log('\tTowns saved successfully in the database');
  }

  private async seedCategoriesFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.logger.log('Creating categories...');
    const sheetCategories = workbook.getCategories();
    const sheetModels = workbook.getModels();
    const sheetIcons = workbook.getIcons();

    this.logger.log('\tGet all categories from the database');
    const dbCategories = await queryRunner.manager.find(Category, {});
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

    this.logger.log('\tSaving categories...');
    await queryRunner.manager.save(Category, categories);
    this.logger.log('\tCategories saved successfully in the database');
  }

  private async seedFacilitiesFromWorkbook(workbook: SeedWorkbook, queryRunner: QueryRunner) {
    this.logger.log('Creating facilities...');
    const sheetFacilities = workbook.getFacilities();
    const sheetModels = workbook.getModels();

    this.logger.log('\tGet all facilities from the database');
    const dbFacilities = await queryRunner.manager.find(Facility, {});
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

    this.logger.log('\tSaving facilities...');
    await queryRunner.manager.save(Facility, facilities);
    this.logger.log('\tFacilities saved successfully in the database');
  }

  private async seedPlacesFromWorkbook({
    workbook,
    queryRunner,
    addImageToDelete,
    addTempImage,
    createOrRecreateImages = true,
  }: SeedMainEntityProps) {
    this.writeLog('Creating places...');

    const placesData = workbook.getPlaces();
    const categoriesData = workbook.getCategories();
    const facilitiesData = workbook.getFacilities();
    const townsData = workbook.getTowns();

    this.writeLog(`Records of file: ${placesData.length}`, 1);

    this.writeLog('Get all places from database', 1);
    const dbPlaces = await queryRunner.manager.find(Place, {
      relations: { categories: true, facilities: true, images: { imageResource: true } },
    });
    this.writeLog(`DB place found: ${dbPlaces.length}`, 2);

    for (const placeData of placesData) {
      this.writeLog(`Processing place ${placeData.name}`, 1);

      const existingPlace = dbPlaces.find(p => p.id === placeData.id);
      if (existingPlace) this.writeLog('The place already exists', 2);

      this.writeLog(`Recover images from cloudinary`, 2);
      const folderImages = await this.getImagesFromFolder(placeData.cloudinaryFolder);
      this.writeLog(`Images found: ${folderImages.length}`, 3);

      if (folderImages.length === 0 && (!existingPlace || createOrRecreateImages)) {
        this.writeLog('No images found, continue with the next place', 3);
        continue;
      }

      // * Get the category ids using the category names
      const placeCategories = matchCategoriesByValue({ value: placeData.category, categories: categoriesData });
      if (placeCategories.length === 0) this.writeLog('No category found', 2);
      else this.writeLog(`Place categories: ${placeCategories.map(c => c.name).join(', ')}`, 2);

      // * Get the facility ids using the facility names
      const facilities = matchFacilitiesByValue({ value: placeData.facilities, facilities: facilitiesData });
      if (facilities.length === 0) this.writeLog('No facility found', 2);
      else this.writeLog(`Place facilities: ${facilities.map(f => f.name).join(', ')}`, 2);

      // * Get the town id using the town name
      const town = townsData.find(t => t.name.toLocaleLowerCase() === placeData.town.toLocaleLowerCase());
      if (!town) this.writeLog('No town found', 2);
      else this.writeLog(`Place town: ${town.name}`, 2);

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
      this.writeLog('Save place in the database with sheet data', 2);
      const place = existingPlace ? queryRunner.manager.merge(Place, existingPlace, newPlace) : newPlace;
      await queryRunner.manager.save(Place, place);

      if (createOrRecreateImages || !existingPlace) {
        // * Remove old images and save the new ones
        this.writeLog(`Remove old images...`, 2);
        if (place.images) {
          const promises: Promise<any>[] = [];
          place.images.forEach(image => {
            const { imageResource } = image;
            if (imageResource && imageResource.publicId) addImageToDelete(imageResource.publicId);
            promises.push(queryRunner.manager.remove(image));
          });
          await Promise.all(promises);
        }

        this.writeLog(`Save images...`, 2);
        const cloudinaryRes = await Promise.all(
          folderImages.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, `${place.name}`, CloudinaryPresets.PLACE_IMAGE),
          ),
        );

        this.writeLog(`Save ${cloudinaryRes.length} images in cloudinary!`, 2);

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

        this.writeLog(`Save ${imageResources.length} images resource in the database...`, 2);
        await queryRunner.manager.save(ImageResource, imageResources);

        // * Save the images in the database and add ID to global array
        this.writeLog(`Add image to place and updating...`, 2);
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
  }

  private async seedLodgingsFromWorkbook({
    workbook,
    queryRunner,
    addImageToDelete,
    addTempImage,
    createOrRecreateImages,
  }: SeedMainEntityProps) {
    this.writeLog('Creating lodgings...');

    const lodgingsData = workbook.getLodgings();
    const categoriesData = workbook.getCategories();
    const facilitiesData = workbook.getFacilities();
    const townsData = workbook.getTowns();

    this.writeLog(`Records of file: ${lodgingsData.length}`, 1);

    this.writeLog('Get all lodgings from database', 1);
    const dbLodgings = await queryRunner.manager.find(Lodging, {
      relations: { categories: true, facilities: true, images: { imageResource: true } },
    });
    this.writeLog(`DB lodging found: ${dbLodgings.length}`, 2);

    for (const lodgingData of lodgingsData) {
      this.writeLog(`Processing lodging ${lodgingData.name}`, 1);

      const existingLodging = dbLodgings.find(l => l.id === lodgingData.id);
      if (existingLodging) this.writeLog('The lodging already exists', 2);

      this.writeLog(`Recover images from cloudinary`, 2);
      const folderImages = await this.getImagesFromFolder(lodgingData.slug, 'lodgings');
      this.writeLog(`Images found: ${folderImages.length}`, 3);

      if (folderImages.length === 0 && (!existingLodging || createOrRecreateImages)) {
        this.writeLog('No images found, continue with the next lodging', 3);
        continue;
      }

      // * Get the category ids using the category names
      const lodgingCategories = matchCategoriesByValue({ value: lodgingData.categories, categories: categoriesData });
      if (lodgingCategories.length === 0) this.writeLog('No category found', 2);
      else this.writeLog(`Lodging categories: ${lodgingCategories.map(c => c.name).join(', ')}`, 2);

      // * Get the facility ids using the facility names
      const facilities = matchFacilitiesByValue({ value: lodgingData.facilities, facilities: facilitiesData });
      if (facilities.length === 0) this.writeLog('No facility found', 2);
      else this.writeLog(`Lodging facilities: ${facilities.map(f => f.name).join(', ')}`, 2);

      // * Get the town id using the town name
      const town = townsData.find(t => t.name.toLocaleLowerCase() === lodgingData.town.toLocaleLowerCase());
      if (!town) this.writeLog('No town found', 2);
      else this.writeLog(`Lodging town: ${town.name}`, 2);

      // * Create the lodging object with the data from the sheet
      const lodginFacilities = await Promise.all(
        facilities.map(f => {
          const facility = queryRunner.manager.create(LodgingFacility, {
            facility: { id: f.id },
            lodging: { id: lodgingData.id },
          });
          return queryRunner.manager.save(LodgingFacility, facility);
        }),
      );

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
        phones: lodgingData.phones?.split(',').map(p => p.trim()),
        email: lodgingData.email,
        website: lodgingData.website,
        facebook: lodgingData.facebook,
        instagram: lodgingData.instagram,
        whatapps: lodgingData.whatsapps?.split(',').map(w => w.trim()),
        openingHours: lodgingData.openingHours,
        languageSpoken: lodgingData.languages,
        // ------------------------------------------------
        location: { type: 'Point', coordinates: [+lodgingData.longitude, +lodgingData.latitude] },
        googleMapsUrl: lodgingData.googleMaps,
        howToGetThere: lodgingData.howToGetThere,
        arrivalReference: lodgingData.zone,
        // ------------------------------------------------
        isPublic: true,
        town: town ? { id: town.id } : undefined,
        categories: lodgingCategories.map(c => ({ id: c.id })),
        facilities: lodginFacilities,
      });

      // * Save the lodging in the database with only the data from the sheet without images
      this.writeLog('Save lodging in the database with sheet data', 2);
      const lodging = existingLodging ? queryRunner.manager.merge(Lodging, existingLodging, newLodging) : newLodging;
      await queryRunner.manager.save(Lodging, lodging);

      if (createOrRecreateImages || !existingLodging) {
        // * Remove old images and save the new ones
        this.writeLog(`Remove old images...`, 2);
        if (lodging.images) {
          const promises: Promise<any>[] = [];
          lodging.images.forEach(image => {
            const { imageResource } = image;
            if (imageResource && imageResource.publicId) addImageToDelete(imageResource.publicId);
            promises.push(queryRunner.manager.remove(image));
          });
          await Promise.all(promises);
        }

        this.writeLog(`Save images...`, 2);
        const cloudinaryRes = await Promise.all(
          folderImages.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, `${lodging.name}`, CloudinaryPresets.LODGING_IMAGE),
          ),
        );

        this.writeLog(`Save ${cloudinaryRes.length} images in cloudinary!`, 2);

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

        this.writeLog(`Save ${imageResources.length} images resource in the database...`, 2);
        await queryRunner.manager.save(ImageResource, imageResources);

        // * Save the images in the database and add ID to global array
        this.writeLog(`Add image to lodging and updating...`, 2);
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
  }

  private async getImagesFromFolder(folder: string, base = 'places') {
    const url = `banco-de-imagenes/${base}/${folder.trim()}`;
    const res = await this.cloudinaryService.getResourceFromFolder(url);
    if (!res || (res.resources.length as number) === 0) return [];

    const { resources } = res;

    const mainIndex = resources.findIndex(
      ({ public_id, display_name }) => public_id.includes('main') || display_name.includes('main'),
    );

    const images: string[] = [];
    if (mainIndex !== -1) images.push(res.resources[mainIndex].secure_url);
    res.resources.forEach((resource, i) => {
      if (i === mainIndex) return;
      images.push(resource.secure_url);
    });

    return images;
  }

  private async deleteImagesInBatches(publicIds: string[]) {
    if (publicIds.length === 0) return;

    this.writeLog(`Clear Cloudinary images [${publicIds.length}]...`);

    const batchSize = 10;

    for (let i = 0; i < publicIds.length; i += batchSize) {
      const count = Math.min(batchSize, publicIds.length - i);
      this.writeLog(`Deleting batch ${i + 1} to ${i + count}...`, 1);
      const batch = publicIds.slice(i, i + batchSize);
      await Promise.all(batch.map(id => this.cloudinaryService.destroyFile(id)));
    }

    this.writeLog('All images have been destroyed successfully');
  }

  private writeLog(message: string, level = 0) {
    const tabs = '  '.repeat(level);
    this.logger.log(`${tabs}${message}`);
  }
}
