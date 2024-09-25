import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { Session } from './entities';
import { EnvironmentVariables } from 'src/config';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { LocalStrategy, JwtStrategy, GoogleStrategy, OptionalJwtStrategy } from './strategies';
import { ProfileController } from './profile.controller';

import { AuthService, SessionService } from './services';

@Module({
  imports: [
    UsersModule,

    PassportModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables>) => ({
        secret: config.get('jwt.secret', { infer: true }),
        signOptions: { expiresIn: config.get('jwt.expiresIn', { infer: true }) },
      }),
    }),

    TypeOrmModule.forFeature([Session]),
  ],
  providers: [AuthService, SessionService, LocalStrategy, JwtStrategy, GoogleStrategy, OptionalJwtStrategy],
  controllers: [AuthController, ProfileController],
  exports: [JwtModule],
})
export class AuthModule {}
