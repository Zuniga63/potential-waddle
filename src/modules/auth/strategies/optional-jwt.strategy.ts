import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { EnvironmentVariables } from 'src/config';
import { UsersService } from 'src/modules/users/services';
import { JwtPayload } from '../interfaces/JwtPayload.interface';
import { SessionService } from '../services';

@Injectable()
export class OptionalJwtStrategy extends PassportStrategy(Strategy, 'optional-jwt') {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    configService: ConfigService<EnvironmentVariables>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: id, session_id } = payload;
    if (!session_id) return null;

    const user = await this.usersService.findOneWithSessionAndRole(id, payload.session_id);
    if (!user) throw null;

    this.sessionService.updateLastActivity(session_id);
    delete user.sessions;

    return user;
  }
}
