import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlacesAuthService } from './places-auth.service';
import { ConfigModule } from '@nestjs/config';
import { PlacesAuthController } from './places-auth.controller';

@Module({
  controllers: [PlacesAuthController],
  providers: [PlacesAuthService],
  imports: [HttpModule, ConfigModule],
})
export class PlacesAuthModule {}
