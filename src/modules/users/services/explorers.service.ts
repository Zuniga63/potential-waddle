import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoint } from '../entities/user-point.entity';
import { UserExplorerDto, UserExplorerLocationDto, UserExplorerPlaceDto } from '../dto';
import { ExplorerDBResult } from '../interfaces';
import { Place } from 'src/modules/places/entities';
import { calculateAge } from 'src/utils';
import { ReviewStatusEnum } from 'src/modules/reviews/enums';
import { User } from '../entities';

@Injectable()
export class ExplorersService {
  constructor(
    @InjectRepository(UserPoint)
    private readonly userPointRepository: Repository<UserPoint>,

    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllExplorersRanking({ search }: { search?: string } = {}): Promise<UserExplorerDto[]> {
    try {
      const query = this.userPointRepository
        .createQueryBuilder('userPoint')
        .select([
          'user.id as user_id',
          'user.username as username',
          'user.birth_date as birth_date',
          'user.profile_photo as profile_photo',
          'user.country as country',
          'user.country_state as country_state',
          'user.city as city',
          'COUNT(DISTINCT userPoint.place_id) as visited_places',
          'SUM(userPoint.points_earned) as total_points',
          'SUM(userPoint.distance_travelled) as total_distance',
        ])
        .innerJoin('userPoint.user', 'user')
        .leftJoin('userPoint.place', 'place')
        .groupBy('user.id')
        .addGroupBy('user.username')
        .orderBy('total_points', 'DESC');

      if (search) query.andWhere('user.username ILIKE :search', { search: `%${search}%` });

      const explorersRanking: ExplorerDBResult[] = await query.getRawMany();

      return explorersRanking.map(explorer => ({
        id: explorer.user_id,
        name: explorer.username,
        profileImage: explorer?.profile_photo?.url ?? '',
        age: explorer.birth_date ? calculateAge(new Date(explorer.birth_date)) : undefined,
        stats: {
          points: Number(explorer.total_points),
          distanceTraveled: Number(explorer.total_distance),
          visitedPlaces: Number(explorer.visited_places),
        },
        location: {
          country: explorer.country,
          city: explorer.city,
          countryState: explorer.country_state,
        },
      }));
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOneExplorer(id: string): Promise<UserExplorerDto> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .select('user.id', 'user_id')
      .addSelect('user.username', 'username')
      .addSelect('user.profile_photo', 'profile_photo')
      .addSelect('user.birth_date', 'birth_date')
      .addSelect('user.country', 'country')
      .addSelect('user.country_state', 'country_state')
      .addSelect('user.city', 'city')
      .addSelect('COALESCE(COUNT(DISTINCT userPoint.place_id), 0)', 'visited_places')
      .addSelect('COALESCE(SUM(userPoint.points_earned), 0)', 'total_points')
      .addSelect('COALESCE(SUM(userPoint.distance_travelled), 0)', 'total_distance')
      .leftJoin('user.points', 'userPoint')
      .where('user.id = :id', { id })
      .groupBy('user.id');

    const explorer: ExplorerDBResult | undefined = await query.getRawOne();
    if (!explorer) throw new NotFoundException('Explorer not found');

    const location: UserExplorerLocationDto = {
      country: explorer.country,
      countryState: explorer.country_state,
      city: explorer.city,
    };

    return {
      id: explorer.user_id,
      name: explorer.username,
      profileImage: explorer.profile_photo?.url ?? '',
      age: explorer.birth_date ? calculateAge(new Date(explorer.birth_date)) : undefined,
      location,
      stats: {
        points: Number(explorer.total_points),
        distanceTraveled: Number(explorer.total_distance),
        visitedPlaces: Number(explorer.visited_places),
      },
    };
  }

  async findPlacesVisitedByExplorer(userId: string): Promise<UserExplorerPlaceDto[]> {
    const places = await this.placeRepository.find({
      relations: { reviews: { user: true }, images: { imageResource: true } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        images: { id: true, imageResource: { url: true } },
        reviews: { user: { id: true }, rating: true, status: true },
      },
      order: { name: 'ASC', images: { order: 'ASC' } },
    });

    return places.map(place => {
      const { images, reviews } = place;
      const userReview = reviews.find(review => review.user?.id === userId);
      const image = images[0].imageResource.url ?? '';

      return {
        id: place.id,
        name: place.name,
        slug: place.slug,
        image,
        description: place.description,
        isVisited: Boolean(userReview),
        rating: userReview?.rating,
        status: userReview?.status ?? ReviewStatusEnum.PENDING,
      };
    });
  }
}
