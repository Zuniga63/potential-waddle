import { Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Auth } from '../auth/decorators';
import { GetUser } from '../common/decorators';
import { User } from '../users/entities';
import { ResendService } from '../email/services/resend.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly resendService: ResendService) {}

  /**
   * Fired by the frontend OnboardingRedirector after a successful business signup.
   * Returns 202 immediately; email dispatch is fire-and-forget.
   */
  @Post('welcome-business')
  @Auth()
  @HttpCode(202)
  async welcomeBusiness(@GetUser() user: User) {
    void this.resendService.sendBusinessWelcomeEmail(user.email, user.username || user.email);
    return { ok: true };
  }
}
