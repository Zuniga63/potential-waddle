import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('optional-jwt') {
  handleRequest<TUser = User>(err: any, user: any): TUser {
    // ? Si hay un error (token inválido, expirado, etc.) o no hay usuario, retorna null
    if (err || !user) {
      return null as TUser;
    }
    return user;
  }
}
