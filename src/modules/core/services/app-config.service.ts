import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '../entities/app-config.entity';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectRepository(AppConfig)
    private readonly appConfigRepository: Repository<AppConfig>,
  ) {}

  async findAll(): Promise<AppConfig[]> {
    return this.appConfigRepository.find({
      order: { key: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<AppConfig | null> {
    return this.appConfigRepository.findOne({
      where: { key },
    });
  }

  async getValue(key: string): Promise<string | null> {
    const config = await this.findByKey(key);
    return config ? config.value : null;
  }

  async setValue(key: string, value: string, description?: string): Promise<AppConfig> {
    const existingConfig = await this.findByKey(key);

    if (existingConfig) {
      existingConfig.value = value;
      if (description) {
        existingConfig.description = description;
      }
      return this.appConfigRepository.save(existingConfig);
    } else {
      const newConfig = this.appConfigRepository.create({
        key,
        value,
        description,
      });
      return this.appConfigRepository.save(newConfig);
    }
  }

  async updateValue(key: string, value: string): Promise<AppConfig | null> {
    const config = await this.findByKey(key);
    if (config) {
      config.value = value;
      return this.appConfigRepository.save(config);
    }
    return null;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.appConfigRepository.delete({ key });
    return (result?.affected ?? 0) > 0;
  }

  // Métodos específicos para la configuración de Rafa
  async getRafaMode(): Promise<'basic' | 'superIA'> {
    const value = await this.getValue('rafa_mode');
    return value === 'superIA' ? 'superIA' : 'basic';
  }

  async setRafaMode(mode: 'basic' | 'superIA'): Promise<AppConfig> {
    return this.setValue(
      'rafa_mode',
      mode,
      'Modo de funcionamiento de Rafa: basic (chat clásico) o superIA (SuperRafa)',
    );
  }
}
