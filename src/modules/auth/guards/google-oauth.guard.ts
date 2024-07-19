import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { access_token, id_token } = request.query;

    // Si se proporcionan access_token o id_token, permite que la solicitud pase directamente al controlador
    if (access_token || id_token) {
      return true;
    }

    // De lo contrario, usa GoogleOauthGuard
    return super.canActivate(context);
  }
}
