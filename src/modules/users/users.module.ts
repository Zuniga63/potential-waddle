import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController, ExplorersController } from './controllers';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UsersService, ExplorersService } from './services';
import { UserPoint, User } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPoint]), CloudinaryModule],
  controllers: [UsersController, ExplorersController],
  providers: [UsersService, ExplorersService],
  exports: [UsersService],
})
export class UsersModule {}
