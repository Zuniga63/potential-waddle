import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { randomBytes } from 'crypto';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services';
import { ResendService } from '../../email/services/resend.service';
import { hashPassword } from '../utils/hash-password';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly usersService: UsersService,
    private readonly resendService: ResendService,
  ) {}

  async createPasswordResetToken(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findOneByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
      };
    }

    // Invalidate any existing tokens for this user
    await this.invalidateExistingTokens(user.id);

    // Generate a secure random token
    const token = randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save the token
    const passwordResetToken = this.passwordResetTokenRepository.create({
      token,
      user,
      expiresAt,
    });
    await this.passwordResetTokenRepository.save(passwordResetToken);

    // Send the email
    const emailSent = await this.resendService.sendPasswordResetEmail(user.email, user.username, token);

    if (!emailSent) {
      this.logger.error(`Failed to send password reset email to ${email}`);
    }

    return {
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, isUsed: false },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    // Update the user's password
    const hashedPassword = hashPassword(newPassword);
    await this.usersService.updatePassword(resetToken.user.id, hashedPassword);

    // Mark token as used
    resetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(resetToken);

    this.logger.log(`Password reset successful for user ${resetToken.user.email}`);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  async invalidateExistingTokens(userId: string): Promise<void> {
    await this.passwordResetTokenRepository.update({ user: { id: userId }, isUsed: false }, { isUsed: true });
  }

  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.passwordResetTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    this.logger.log(`Cleaned up ${result.affected} expired password reset tokens`);
  }
}
