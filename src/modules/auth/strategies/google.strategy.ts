import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { AuthService } from '../services';
import { GoogleUserDto } from '../dto/google-user.dto';
import { EnvironmentVariables } from 'src/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    configService: ConfigService<EnvironmentVariables>,
  ) {
    super({
      clientID: configService.get('googleOAuth.clientId', { infer: true }),
      clientSecret: configService.get('googleOAuth.clientSecret', { infer: true }),
      callbackURL: configService.get('googleOAuth.callbackUrl', { infer: true }),
      scope: ['email', 'profile'],
    });
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any> {
    const googleUser = new GoogleUserDto();
    googleUser.loadFromGoogleProfile(profile);
    googleUser.accessToken = accessToken;
    googleUser.refreshToken = refreshToken;

    const user = await this.authService.getUserFromGoogleAuth(googleUser);

    done(null, user);
  }
}
