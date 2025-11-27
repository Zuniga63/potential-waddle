import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/app-config';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string;
  private readonly isEnabled: boolean;

  constructor(configService: ConfigService<EnvironmentVariables>) {
    this.secretKey = configService.get<string>('turnstile.secretKey', { infer: true }) || '';
    this.isEnabled = !!this.secretKey;

    if (!this.isEnabled) {
      this.logger.warn('Turnstile is disabled: TURNSTILE_SECRET_KEY not configured');
    }
  }

  async verify(token: string, ip?: string): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.warn('Turnstile verification skipped: not configured');
      return true;
    }

    if (!token) {
      throw new BadRequestException('Turnstile token is required');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (ip) {
        formData.append('remoteip', ip);
      }

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data: TurnstileVerifyResponse = await response.json();

      if (!data.success) {
        this.logger.warn(`Turnstile verification failed: ${data['error-codes']?.join(', ')}`);
        throw new BadRequestException('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Turnstile verification error:', error);
      throw new BadRequestException('Error en la verificación de seguridad');
    }
  }
}
