import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoint } from '../entities/user-point.entity';
import { UserExplorerDto, UserExplorerPlaceDto } from '../dto';
import { ExplorerDBResult } from '../interfaces';
import { Place } from 'src/modules/places/entities';

@Injectable()
export class ExplorersService {
  constructor(
    @InjectRepository(UserPoint)
    private readonly userPointRepository: Repository<UserPoint>,

    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
  ) {}

  async findAllExplorersRanking({ search }: { search?: string } = {}): Promise<UserExplorerDto[]> {
    try {
      const query = this.userPointRepository
        .createQueryBuilder('userPoint')
        .select([
          'user.id as user_id',
          'user.username as username',
          'user.profile_photo as profile_photo',
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

      console.log(explorersRanking);

      return explorersRanking.map(explorer => ({
        id: explorer.user_id,
        name: explorer.username,
        profileImage: explorer.profile_photo.url,
        stats: {
          points: Number(explorer.total_points),
          distanceTraveled: Number(explorer.total_distance),
          visitedPlaces: Number(explorer.visited_places),
        },
      }));
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOneExplorer(id: string): Promise<UserExplorerDto> {
    const query = this.userPointRepository
      .createQueryBuilder('userPoint')
      .select('user.id', 'user_id')
      .addSelect('user.username', 'username')
      .addSelect('user.profile_photo', 'profile_photo')
      .addSelect('COUNT(DISTINCT userPoint.place_id)', 'visited_places')
      .addSelect('SUM(userPoint.points_earned)', 'total_points')
      .addSelect('SUM(userPoint.distance_travelled)', 'total_distance')
      .innerJoin('userPoint.user', 'user')
      .where('user.id = :id', { id })
      .groupBy('user.id, user.username');

    const explorer: ExplorerDBResult | undefined = await query.getRawOne();
    if (!explorer) throw new NotFoundException('Explorer not found');

    return {
      id: explorer.user_id,
      name: explorer.username,
      profileImage: explorer.profile_photo.url,
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
        reviews: { user: { id: true }, rating: true },
      },
      order: { name: 'ASC' },
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
      };
    });
  }
}
