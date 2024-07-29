import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Department, Town } from '../towns/entities';
import { DataSource, Repository } from 'typeorm';
import { Category, Facility, ImageResource, Language, Model } from '../core/entities';
import { CATEGORIES, DEPARTMENTS, FACILITIES, LANGUAGES, MODELS, TOWNS } from './constants';
import * as placeListData from './mocks/places.json';
import { Place, PlaceImage } from '../places/entities';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryPresets, ResourceProvider } from 'src/config';

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

    const images = await this.imageResourceRepository.find();
    images.forEach(image => {
      this.cloudinaryService.destroyFile(image.publicId);
    });

    try {
      // Desactivar temporalmente las restricciones de clave foránea en Postgres
      await queryRunner.query('SET session_replication_role = replica;');

      // Recupero todas la tablas de la base de datos omitiendo la tabla de migraciones
      const tables = await queryRunner.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name != 'migrations';`,
      );

      // Truncar todas las tablas y reiniciar las secuencias
      for (const { table_name } of tables) {
        this.logger.log(`Truncating table ${table_name}`);
        await queryRunner.query(`TRUNCATE TABLE "${table_name}" RESTART IDENTITY CASCADE;`);
      }

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

    const models: unknown[] = [];

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

    const towns: unknown[] = [];

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

    const languages: unknown[] = [];

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
    const facilities: unknown[] = [];
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

    const categories: unknown[] = [];

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
        const categories = placeData.categories
          .map(category => CATEGORIES.find(c => c.name === category.name))
          .filter(Boolean)
          .map(categoryFound => ({ id: categoryFound.id }));

        const facilities = placeData.facilities
          .map(facility => FACILITIES.find(f => f.name === facility.name))
          .filter(Boolean)
          .map(facilityFound => ({ id: facilityFound.id }));

        const place = this.placeRepository.create({
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
          googleMapsUrl: placeData.google_maps_link,
          history: placeData.history,
          temperature: placeData.temperature,
          maxDepth: placeData.max_depth,
          altitude: placeData.altitude,
          capacity: placeData.capacity,
          minAge: placeData.min_age,
          maxAge: placeData.max_age,
          howToGetThere: placeData.how_to_get_there,
          howToDress: placeData.how_to_dress,
          restrictions: placeData.restrictions,
          recommendations: placeData.recommendations,
          observations: placeData.observations,
        });

        await queryRunner.manager.save(Place, place);

        const imagesUrls: string[] = [placeData.image, ...placeData.images];
        const cloudinaryRes = await Promise.all(
          imagesUrls.map(url =>
            this.cloudinaryService.uploadImageFromUrl(url, placeData.name, CloudinaryPresets.PLACE_PHOTO),
          ),
        );

        const images = cloudinaryRes
          .filter(res => res)
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
}
