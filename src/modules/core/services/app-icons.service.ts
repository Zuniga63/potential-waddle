import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppIcon } from '../entities';
import { Repository } from 'typeorm';
import { CreateAppIconDto, UpdateAppIconDto } from '../dto';

@Injectable()
export class AppIconsService {
  constructor(
    @InjectRepository(AppIcon)
    private readonly appIconsRepository: Repository<AppIcon>,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW APP ICON
  // * -------------------------------------------------------------------------------------------------------------
  async create(createAppIconDto: CreateAppIconDto) {
    const appIcon = this.appIconsRepository.create(createAppIconDto);
    return this.appIconsRepository.save(appIcon);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL APP ICONS
  // * -------------------------------------------------------------------------------------------------------------
  async findAll() {
    return this.appIconsRepository.find({
      order: { name: 'ASC' },
    });
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL APP ICONS (FULL)
  // * -------------------------------------------------------------------------------------------------------------
  async findAllFull() {
    return this.appIconsRepository.find({
      relations: { categories: true, facilities: true },
      order: { name: 'ASC' },
    });
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET APP ICON BY ID
  // * -------------------------------------------------------------------------------------------------------------
  async findOne(id: string) {
    const appIcon = await this.appIconsRepository.findOne({
      where: { id },
      relations: { categories: true, facilities: true },
    });

    if (!appIcon) {
      throw new NotFoundException('App Icon not found');
    }

    return appIcon;
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE APP ICON
  // * -------------------------------------------------------------------------------------------------------------
  async update(id: string, updateAppIconDto: UpdateAppIconDto) {
    const existingAppIcon = await this.appIconsRepository.findOne({
      where: { id },
    });

    if (!existingAppIcon) {
      throw new NotFoundException('App Icon not found');
    }

    const updatedAppIcon = await this.appIconsRepository.save({
      ...existingAppIcon,
      ...updateAppIconDto,
    });

    return this.appIconsRepository.findOne({
      where: { id: updatedAppIcon.id },
      relations: { categories: true, facilities: true },
    });
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE APP ICON
  // * -------------------------------------------------------------------------------------------------------------
  async remove(id: string) {
    const appIcon = await this.appIconsRepository.findOne({
      where: { id },
      relations: { categories: true, facilities: true },
    });

    if (!appIcon) {
      throw new NotFoundException('App Icon not found');
    }

    // Check if the icon has relationships
    const hasRelations =
      (appIcon.categories && appIcon.categories.length > 0) ||
      (appIcon.facilities && appIcon.facilities.length > 0);

    if (hasRelations) {
      throw new ConflictException(
        'Cannot delete app icon with active relationships. Please remove all associated categories and facilities first.',
      );
    }

    await this.appIconsRepository.remove(appIcon);
    return { message: `App Icon "${appIcon.name}" has been successfully deleted` };
  }
} 