import { Controller, HttpCode, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags } from '@nestjs/swagger';

import { Auth } from '../auth/decorators';
import { GetUser } from '../common/decorators';
import { User } from '../users/entities';
import { ResendService } from '../email/services/resend.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly resendService: ResendService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Fired by the frontend OnboardingRedirector after a successful business signup.
   * Returns 202 immediately; email dispatch is fire-and-forget.
   *
   * Side effect: marks the user as interestedInBusiness=true so we can follow up
   * with users who intended to list a business but abandoned before creating one.
   * The flag is cleared when they create their first business (see LodgingsService.create).
   */
  @Post('welcome-business')
  @Auth()
  @HttpCode(202)
  async welcomeBusiness(@GetUser() user: User) {
    void this.resendService.sendBusinessWelcomeEmail(user.email, user.username || user.email);
    await this.userRepository.update(user.id, { interestedInBusiness: true });
    return { ok: true };
  }
}
