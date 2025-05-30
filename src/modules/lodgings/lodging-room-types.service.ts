import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LodgingRoomType, Lodging } from './entities';
import { CreateLodgingRoomTypeDto, UpdateLodgingRoomTypeDto } from './dto';

@Injectable()
export class LodgingRoomTypesService {
  private readonly logger = new Logger(LodgingRoomTypesService.name);

  constructor(
    @InjectRepository(LodgingRoomType)
    private readonly lodgingRoomTypeRepository: Repository<LodgingRoomType>,
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
  ) {}

  // ------------------------------------------------------------------------------------------------
  // Create room type
  // ------------------------------------------------------------------------------------------------
  async create(lodgingId: string, createLodgingRoomTypeDto: CreateLodgingRoomTypeDto) {
    const lodging = await this.lodgingRepository.findOne({ where: { id: lodgingId } });

    if (!lodging) {
      throw new NotFoundException('Lodging not found');
    }

    try {
      const roomType = await this.lodgingRoomTypeRepository.save({
        ...createLodgingRoomTypeDto,
        lodging,
      });

      return roomType;
    } catch (error) {
      throw new BadRequestException(`Error creating room type: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Find all room types for a lodging
  // ------------------------------------------------------------------------------------------------
  async findByLodging(lodgingId: string) {
    return this.lodgingRoomTypeRepository.find({
      where: { lodging: { id: lodgingId }, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  // ------------------------------------------------------------------------------------------------
  // Find one room type
  // ------------------------------------------------------------------------------------------------
  async findOne(id: string) {
    const roomType = await this.lodgingRoomTypeRepository.findOne({
      where: { id, isActive: true },
      relations: ['lodging'],
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    return roomType;
  }

  // ------------------------------------------------------------------------------------------------
  // Update room type
  // ------------------------------------------------------------------------------------------------
  async update(id: string, updateLodgingRoomTypeDto: UpdateLodgingRoomTypeDto) {
    await this.findOne(id); // Just validate existence

    try {
      await this.lodgingRoomTypeRepository.update(id, updateLodgingRoomTypeDto);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(`Error updating room type: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Soft delete room type
  // ------------------------------------------------------------------------------------------------
  async remove(id: string) {
    const roomType = await this.findOne(id);

    try {
      await this.lodgingRoomTypeRepository.update(id, { isActive: false });
      return { message: `Room type ${roomType.name} has been deleted` };
    } catch (error) {
      throw new BadRequestException(`Error deleting room type: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Hard delete room type
  // ------------------------------------------------------------------------------------------------
  async delete(id: string) {
    const roomType = await this.findOne(id);

    try {
      await this.lodgingRoomTypeRepository.delete(id);
      return { message: `Room type ${roomType.name} has been permanently deleted` };
    } catch (error) {
      throw new BadRequestException(`Error deleting room type: ${error.message}`);
    }
  }
}
