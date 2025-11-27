import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController, ExplorersController, AdminUsersController } from './controllers';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UsersService, ExplorersService } from './services';
import { UserPoint, User } from './entities';
import { Place } from '../places/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPoint, Place]), CloudinaryModule],
  controllers: [UsersController, ExplorersController, AdminUsersController],
  providers: [UsersService, ExplorersService],
  exports: [UsersService],
})
export class UsersModule {}
