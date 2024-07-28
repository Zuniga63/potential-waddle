import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Department, Town } from '../towns/entities';
import { DataSource, Repository } from 'typeorm';
import { Category, Facility, Language, Model } from '../core/entities';
import { CATEGORIES, FACILITIES, MODELS } from './constants';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger('SeedsService');

  constructor(
    @InjectRepository(Department)
    private readonly municipalityRepository: Repository<Department>,

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

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create() {
    this.logger.log('Creating seed...');
    await this.truncateAllTables();
    await this.createModels();
    await this.createTowns();
    await this.createLanguages();
    await this.createFacilities();
    await this.createCategories();
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
      await queryRunner.query('SET session_replication_role = replica;');

      // Recupero todas la tablas de la base de datos
      const tables = await queryRunner.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE';`,
      );

      // Truncar todas las tablas y reiniciar las secuencias
      for (const { table_name } of tables) {
        this.logger.log(`Truncating table ${table_name}`);
        await queryRunner.query(`TRUNCATE TABLE "${table_name}" RESTART IDENTITY CASCADE;`);
      }

      // reactivar las claves foraneas
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
    const models = Object.values(MODELS).map(model => this.modelRepository.create(model));
    await this.modelRepository.save(models);
  }

  private async createTowns() {
    this.logger.log('Creating towns...');
    const municipality = this.municipalityRepository.create({
      name: 'Antioquia',
      capital: 'Medellín',
    });
    await this.municipalityRepository.save(municipality);

    const town = this.townRepository.create({
      name: 'San Rafael',
      department: municipality,
      description:
        'San Rafael es un municipio de Colombia, localizado en la subregión Nordeste del departamento de Antioquia. Limita por el norte con el municipio de San Carlos, por el este con el municipio de San Roque, por el sur con el municipio de Concepción y por el oeste con el municipio de San Carlos.',
    });

    await this.townRepository.save(town);
  }

  private async createLanguages() {
    this.logger.log('Creating languages...');
    const languages = [
      { name: 'Español', code: 'es' },
      { name: 'Inglés', code: 'en' },
      { name: 'Francés', code: 'fr' },
      { name: 'Alemán', code: 'de' },
      { name: 'Italiano', code: 'it' },
      { name: 'Portugués', code: 'pt' },
    ].map(language => this.languageRepository.create(language));

    await this.languageRepository.save(languages);
  }

  private async createFacilities() {
    this.logger.log('Creating facilities...');
    const facilities = this.facilityRepository.create(FACILITIES as unknown);
    await this.facilityRepository.save(facilities);
  }

  private async createCategories() {
    this.logger.log('Creating categories...');
    const categories = this.categoryRepository.create(CATEGORIES as unknown);
    await this.categoryRepository.save(categories);
  }
}
