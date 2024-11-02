import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoint } from '../entities/user-point.entity';
import { CloudinaryImage } from 'src/modules/cloudinary/interfaces';

@Injectable()
export class ExplorersService {
  constructor(
    @InjectRepository(UserPoint)
    private readonly userPointRepository: Repository<UserPoint>,
  ) {}

  async findAllExplorersRanking() {
    try {
      const explorersRanking: {
        user_id: string;
        username: string;
        profile_photo: CloudinaryImage;
        visited_places: string;
        total_points: string;
        total_distance: string;
      }[] = await this.userPointRepository
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
        .orderBy('total_points', 'DESC')
        .getRawMany();

      console.log(explorersRanking);

      return explorersRanking.map(explorer => ({
        user: {
          id: explorer.user_id,
          name: explorer.username,
          profileImage: explorer.profile_photo.url,
        },
        stats: {
          totalPoints: Number(explorer.total_points),
          totalDistance: Number(explorer.total_distance),
          visitedPlaces: Number(explorer.visited_places),
        },
      }));
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
