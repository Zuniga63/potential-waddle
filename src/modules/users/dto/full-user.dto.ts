import { UserDto } from './user.dto';
import { User } from '../entities/user.entity';
import { Commerce } from 'src/modules/commerce/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { LodgingIndexDto } from 'src/modules/lodgings/dto';
import { ProfileGuideDto } from 'src/modules/auth/dto/profile-guide.dto';

export class FullUserDto extends UserDto {
  lodgings: LodgingIndexDto[];
  restaurants: Restaurant[];
  commerces: Commerce[];
  guide: ProfileGuideDto;
  constructor(user: User) {
    super(user);
    if (user.guide) {
      this.guide = new ProfileGuideDto(user.guide);
    }
    this.lodgings = user.lodgings?.map(lodging => new LodgingIndexDto(lodging)) || [];
    this.restaurants = user.restaurants || [];
    this.commerces = user.commerces || [];
  }
}
