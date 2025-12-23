import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController, ExplorersController, AdminUsersController } from './controllers';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UsersService, ExplorersService } from './services';
import { UserPoint, User } from './entities';
import { Place } from '../places/entities';
import { Restaurant } from '../restaurants/entities';
import { Lodging } from '../lodgings/entities';
import { Experience } from '../experiences/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPoint, Place, Restaurant, Lodging, Experience]), CloudinaryModule],
  controllers: [UsersController, ExplorersController, AdminUsersController],
  providers: [UsersService, ExplorersService],
  exports: [UsersService],
})
export class UsersModule {}
