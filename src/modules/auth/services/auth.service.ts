import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { compareSync } from 'bcrypt';

import { AuthLoginParams } from '../types';
import { CreateUserDto } from '../../users/dto';
import { SessionService } from './session.service';
import { UserDto } from '../../users/dto/user.dto';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services';
import { JwtPayload } from '../interfaces/JwtPayload.interface';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { GoogleUserDto } from '../dto/google-user.dto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.usersService.getFullUser(username);
    if (!user || !user.password || !compareSync(pass, user.password)) return null;

    delete user.password;
    return user;
  }

  async signIn({ user, ip, userAgent }: AuthLoginParams) {
    const session = await this.sessionService.createSession({ user, ip, userAgent });
    const access_token = this.createAccessToken({ user, session_id: session.id });
    return { user: new UserDto(user), access_token };
  }

  async signUp(createUserDto: CreateUserDto) {
    createUserDto.birthDate = createUserDto.birthDate ? new Date(createUserDto.birthDate) : undefined;
    const user = await this.usersService.create(createUserDto);

    console.log('user', user);
    return new UserDto(user);
  }

  async getUserFromGoogleAuth(googleUser: GoogleUserDto) {
    return this.usersService.createFromGoogle(googleUser);
  }

  async signInFromGoogleTokenId({ idToken, ip, userAgent }: { idToken: string; ip?: string; userAgent?: string }) {
    const client = new OAuth2Client({ clientId: this.configService.get('googleOAuth.clientId', { infer: true }) });
    const ticket = await client.verifyIdToken({ idToken });
    const payload = ticket.getPayload();

    if (!payload) throw new Error('Invalid Google ID Token');
    if (!payload.email_verified) throw new Error('Email not verified');
    if (!payload.email) throw new Error('Email not found in Google ID Token');

    const googleUser = new GoogleUserDto();
    googleUser.loadFromGooglePayload(payload);

    const user = await this.usersService.createFromGoogle(googleUser);
    return this.signIn({ user, ip, userAgent });
  }

  async updateProfilePhoto(user: User, file: Express.Multer.File) {
    return this.usersService.updateProfilePhoto(user.id, file);
  }

  async destroyProfilePhoto(user: User) {
    return this.usersService.removeProfilePhoto(user.id);
  }

  async changePassword(user: User, changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(user.email, changePasswordDto);
  }

  private createAccessToken({ user, session_id }: { user: User; session_id: string }) {
    const payload: JwtPayload = { sub: user.id, session_id };
    return this.jwtService.sign(payload);
  }
}
