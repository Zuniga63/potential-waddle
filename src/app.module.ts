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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
