import { Module } from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { CommerceController } from './commerce.controller';
import { Commerce } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageResource } from '../core/entities';
import { Facility } from '../core/entities';
import { Category } from '../core/entities';
import { User } from '../users/entities';
import { Town } from '../towns/entities';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  controllers: [CommerceController],
  providers: [CommerceService],
  imports: [TypeOrmModule.forFeature([Commerce, ImageResource, Category, Facility, Town, User]), CloudinaryModule],
})
export class CommerceModule {}
