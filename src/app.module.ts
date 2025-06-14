import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { appConfig, JoiValidationSchema, typeOrmConfig } from './config';

import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './modules/common/common.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';

import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { TownsModule } from './modules/towns/towns.module';
import { CoreModule } from './modules/core/core.module';
import { PlacesModule } from './modules/places/places.module';
import { SeedsModule } from './modules/seeds/seeds.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { LodgingsModule } from './modules/lodgings/lodgings.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { TinifyModule } from './modules/tinify/tinify.module';
import { TransportModule } from './modules/transport/transport.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { GuidesModule } from './modules/guides/guides.module';
import { GooglePlacesModule } from './modules/google-places/google-places.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      validationSchema: JoiValidationSchema,
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    CommonModule,

    AuthModule,

    UsersModule,

    RolesModule,

    CloudinaryModule,

    TownsModule,

    CoreModule,

    PlacesModule,

    SeedsModule,

    ReviewsModule,

    LodgingsModule,

    ExperiencesModule,

    RestaurantsModule,

    TinifyModule,

    TransportModule,

    CommerceModule,

    GuidesModule,

    GooglePlacesModule,

    HomeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
