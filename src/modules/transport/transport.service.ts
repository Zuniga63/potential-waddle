import { Injectable, NotFoundException } from '@nestjs/common';
import { TransportDto } from './dto/transport.dto';
import { TransportFindAllParams } from './interfaces/transport-find-all-params.interface';
import { generateTransportQueryFiltersAndSort } from './logic/generate-transport-query-filters-and-sort';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, In, Repository } from 'typeorm';
import { Transport } from './entities';
import { CreateTransportDto } from './dto/create-transport.dto';
import { Category } from '../core/entities';
import { Town } from '../towns/entities';
import { User } from '../users/entities';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { TransportListDto } from './dto/transport-list.dto';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(Transport)
    private readonly transportRepository: Repository<Transport>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Town)
    private readonly townRepo: Repository<Town>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(createTransportDto: CreateTransportDto) {
    const { categoryIds, townId, ...restDto } = createTransportDto;
    const categories = categoryIds ? await this.categoryRepo.findBy({ id: In(categoryIds) }) : [];
    const town = townId ? await this.townRepo.findOneBy({ id: townId }) : undefined;
    if (!town) throw new NotFoundException('Town not found');
    const user = restDto.userId ? await this.userRepo.findOneBy({ id: restDto.userId }) : undefined;

    const transport = this.transportRepository.create({
      ...restDto,
      categories,
      town,
      user: user ?? undefined,
    });

    return await this.transportRepository.save(transport);
  }

  async findAll({ filters }: TransportFindAllParams = {}): Promise<TransportListDto> {
    const { page = 1, limit = 25 } = filters ?? {};
    const skip = (page - 1) * limit;
    const { where, order } = generateTransportQueryFiltersAndSort(filters);
    const [transports, count] = await this.transportRepository.findAndCount({
      skip,
      take: limit,
      relations: { categories: { icon: true }, town: { department: true }, user: true },
      order,
      where,
    });

    return new TransportListDto({ currentPage: page, pages: Math.ceil(count / limit), count }, transports);
  }

  async findPublicTransports({ filters }: TransportFindAllParams = {}): Promise<TransportListDto> {
    const shouldRandomize = filters?.sortBy === 'random';
    const { page = 1, limit = 25 } = filters ?? {};
    const skip = (page - 1) * limit;
    const { where, order } = generateTransportQueryFiltersAndSort(filters);

    let transports;
    const [_transports, count] = await this.transportRepository.findAndCount({
      skip,
      take: limit,
      relations: { categories: { icon: true }, town: { department: true }, user: true },
      order,
      where: {
        ...where,
        isPublic: true,
      },
    });

    transports = _transports;
    if (shouldRandomize) {
      console.log('randomize');
      transports = transports.sort(() => Math.random() - 0.5);
    }
    console.log(
      transports.map(t => t.id),
      'transports',
    );

    return new TransportListDto({ currentPage: page, pages: Math.ceil(count / limit), count }, transports);
  }

  async findOne(identifier: string) {
    const relations: FindOptionsRelations<Transport> = {
      categories: { icon: true },
      town: { department: true },
      user: true,
    };

    const transport = await this.transportRepository.findOne({ where: { id: identifier }, relations });
    if (!transport) throw new NotFoundException('Transport not found');
    return new TransportDto({ data: transport });
  }

  async update(id: string, updateTransportDto: UpdateTransportDto) {
    const { categoryIds, townId, userId, ...restDto } = updateTransportDto;
    const categories = categoryIds ? await this.categoryRepo.findBy({ id: In(categoryIds) }) : [];
    const town = townId ? await this.townRepo.findOneBy({ id: townId }) : undefined;
    const user = userId ? await this.userRepo.findOneBy({ id: userId }) : undefined;
    const transport = await this.transportRepository.findOne({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');

    return this.transportRepository.save({
      ...transport,
      ...restDto,
      categories: categories || [],
      town: town || undefined,
      user: user || undefined,
    });
  }

  async remove(id: string) {
    const transport = await this.transportRepository.findOne({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');

    return this.transportRepository.remove(transport);
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    const transport = await this.transportRepository.findOne({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');

    return this.transportRepository.save({
      ...transport,
      isAvailable,
    });
  }
  // ------------------------------------------------------------------------------------------------
  // Update user in transport
  // ------------------------------------------------------------------------------------------------
  async updateUser(identifier: string, userId: string) {
    const transport = await this.transportRepository.findOne({ where: { id: identifier } });
    if (!transport) throw new NotFoundException('Transport not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    transport.user = user;
    await this.transportRepository.save(transport);

    return user;
  }

  // ------------------------------------------------------------------------------------------------
  // Update visibility
  // ------------------------------------------------------------------------------------------------
  async updateVisibility(identifier: string, isPublic: boolean) {
    const transport = await this.transportRepository.findOne({ where: { id: identifier } });

    if (!transport) {
      throw new NotFoundException('Transport not found');
    }
    transport.isPublic = isPublic;
    await this.transportRepository.save(transport);
    return { message: 'Transport visibility updated', data: isPublic };
  }
}
