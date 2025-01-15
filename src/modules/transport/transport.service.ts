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

  async findOne(identifier: string) {
    const relations: FindOptionsRelations<Transport> = {
      categories: { icon: true },
      town: { department: true },
    };

    const transport = await this.transportRepository.findOne({ where: { id: identifier }, relations });
    if (!transport) throw new NotFoundException('Transport not found');

    return new TransportDto({ data: transport });
  }

  async update(id: string, updateTransportDto: UpdateTransportDto) {
    const { categoryIds, townId, ...restDto } = updateTransportDto;
    const categories = categoryIds ? await this.categoryRepo.findBy({ id: In(categoryIds) }) : [];
    const town = townId ? await this.townRepo.findOneBy({ id: townId }) : undefined;
    const transport = await this.transportRepository.findOne({ where: { id } });
    if (!transport) throw new NotFoundException('Transport not found');

    return this.transportRepository.save({
      ...transport,
      ...restDto,
      categories: categories || [],
      town: town || undefined,
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
}
