import { UserDto } from './user.dto';
import { User } from '../entities/user.entity';
import { Commerce } from 'src/modules/commerce/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { ProfileGuideDto } from 'src/modules/auth/dto/profile-guide.dto';
import { Lodging } from 'src/modules/lodgings/entities';

export class FullUserDto extends UserDto {
  lodgings: Lodging[];
  restaurants: Restaurant[];
  commerces: Commerce[];
  guide: ProfileGuideDto;
  constructor(user: User) {
    super(user);
    if (user.guide) {
      this.guide = new ProfileGuideDto(user.guide);
    }
    this.lodgings = user.lodgings || [];
    this.restaurants = user.restaurants || [];
    this.commerces = user.commerces || [];
  }
}
