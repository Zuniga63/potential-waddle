import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, In, Repository } from 'typeorm';
import { Guide } from './entities/guide.entity';
import { Category } from '../core/entities';
import { Town } from '../towns/entities';
import { User } from '../users/entities';
import { GuideFindAllParams } from './interfaces/guide-find-all-params.interface';
import { GuidesListDto } from './dto/guides-list.dto';
import { GuideDto } from './dto/guide.dto';
import { generateGuideQueryFilters } from './utils/generate-guides-query-filters';

@Injectable()
export class GuidesService {
  constructor(
    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Town)
    private readonly townRepo: Repository<Town>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(createGuideDto: CreateGuideDto) {
    const { categoryIds, townId, ...restDto } = createGuideDto;
    const categories = categoryIds ? await this.categoryRepo.findBy({ id: In(categoryIds) }) : [];
    const town = townId ? await this.townRepo.findOneBy({ id: townId }) : undefined;
    if (!town) throw new NotFoundException('Town not found');
    const user = restDto.userId ? await this.userRepo.findOneBy({ id: restDto.userId }) : undefined;

    const guide = this.guideRepository.create({
      ...restDto,
      categories,
      user: user ?? undefined,
    });

    return await this.guideRepository.save(guide);
  }

  async findAll({ filters }: GuideFindAllParams = {}): Promise<GuidesListDto> {
    const { page = 1, limit = 25 } = filters ?? {};
    const skip = (page - 1) * limit;
    const { where, order } = generateGuideQueryFilters(filters);

    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      images: { imageResource: true },
      user: true,
    };

    const [guides, count] = await this.guideRepository.findAndCount({
      skip,
      take: limit,
      relations,
      order,
      where,
    });

    return new GuidesListDto({ currentPage: page, pages: Math.ceil(count / limit), count }, guides);
  }

  async findOne({ identifier }: { identifier: string }) {
    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      user: true,
      images: { imageResource: true },
      experiences: {
        images: { imageResource: true },
      },
    };

    const guide = await this.guideRepository.findOne({ where: { slug: identifier }, relations });
    if (!guide) throw new NotFoundException('Guide not found');
    return new GuideDto({ data: guide });
  }

  async update(id: string, updateGuideDto: UpdateGuideDto) {
    const { categoryIds, townId, userId, ...restDto } = updateGuideDto;
    const categories = categoryIds ? await this.categoryRepo.findBy({ id: In(categoryIds) }) : [];
    const town = townId ? await this.townRepo.findOneBy({ id: townId }) : undefined;
    const user = userId ? await this.userRepo.findOneBy({ id: userId }) : undefined;
    const guide = await this.guideRepository.findOne({ where: { id } });
    if (!guide) throw new NotFoundException('Guide not found');

    const updatedGuide = await this.guideRepository.save({
      ...guide,
      ...restDto,
      categories: categories || [],
      town: town || undefined,
      user: user || undefined,
    });

    return new GuideDto({ data: updatedGuide });
  }

  async remove(id: string) {
    const guide = await this.guideRepository.findOne({ where: { id } });
    if (!guide) throw new NotFoundException('Guide not found');

    return this.guideRepository.remove(guide);
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    const guide = await this.guideRepository.findOne({ where: { id } });
    if (!guide) throw new NotFoundException('Guide not found');

    return this.guideRepository.save({
      ...guide,
      isAvailable,
    });
  }
}
