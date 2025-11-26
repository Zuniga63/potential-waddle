import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EnvironmentVariables } from '../../../config/app-config';
import { getWelcomeEmailTemplate } from '../templates/welcome.template';
import { getResetPasswordTemplate } from '../templates/reset-password.template';

@Injectable()
export class ResendService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(ResendService.name);

  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {
    const apiKey = this.configService.get('resend', { infer: true })?.apiKey;
    this.fromEmail = this.configService.get('resend', { infer: true })?.fromEmail || 'Binntu <noreply@binntu.com>';
    this.frontendUrl = this.configService.get('frontendUrl', { infer: true }) || 'http://localhost:3000';
    this.resend = new Resend(apiKey);
  }

  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    try {
      const { html, subject } = getWelcomeEmailTemplate(username);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send welcome email to ${to}`, error);
        return false;
      }

      this.logger.log(`Welcome email sent to ${to}, id: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${to}`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, username: string, token: string): Promise<boolean> {
    try {
      const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}`;
      const { html, subject } = getResetPasswordTemplate(username, resetUrl);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send password reset email to ${to}`, error);
        return false;
      }

      this.logger.log(`Password reset email sent to ${to}, id: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending password reset email to ${to}`, error);
      return false;
    }
  }
}
