import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get('analytics.apiKey', { infer: true });

    if (!validKey || apiKey !== validKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
