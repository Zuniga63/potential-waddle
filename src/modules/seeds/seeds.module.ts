import { Module } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { SeedsController } from './seeds.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SeedsGateway } from './seeds.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CloudinaryModule, AuthModule, UsersModule],
  controllers: [SeedsController],
  providers: [SeedsService, SeedsGateway],
})
export class SeedsModule {}
