import { TokenPayload } from 'google-auth-library';
import { Profile } from 'passport-google-oauth20';

export class GoogleUserDto {
  id: string;
  email: string;
  username: string;
  picture?: string;
  accessToken?: string;
  refreshToken?: string;

  loadFromGoogleProfile(googleProfile: Profile) {
    this.id = googleProfile.id;
    this.email = googleProfile.emails[0].value;
    this.username = googleProfile.displayName;
    this.picture = googleProfile.photos[0].value;
  }

  loadFromGooglePayload(googlePayload: TokenPayload) {
    this.id = googlePayload.sub;
    this.email = googlePayload.email;
    this.username = googlePayload.name;
    this.picture = googlePayload.picture;
  }
}
