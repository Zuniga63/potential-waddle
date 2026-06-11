import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../users/entities';
import { ResendService } from '../email/services/resend.service';
import { NotificationsController } from './notifications.controller';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-id-1',
  email: 'owner@binntu.test',
  username: 'owner1',
} as unknown as User;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationsController — welcome-business', () => {
  let controller: NotificationsController;
  let resendService: { sendBusinessWelcomeEmail: jest.Mock };

  beforeEach(async () => {
    resendService = { sendBusinessWelcomeEmail: jest.fn().mockResolvedValue(true) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: ResendService, useValue: resendService }],
    }).compile();

    controller = moduleRef.get(NotificationsController);
  });

  // -------------------------------------------------------------------------
  // Test 1: Authenticated request → 202 returned, dispatcher called
  // -------------------------------------------------------------------------
  it('dispatches sendBusinessWelcomeEmail with user email and returns { ok: true }', async () => {
    const result = await controller.welcomeBusiness(mockUser);

    // Give the void fire-and-forget a tick to invoke the mock
    await new Promise(r => setImmediate(r));

    expect(result).toEqual({ ok: true });
    expect(resendService.sendBusinessWelcomeEmail).toHaveBeenCalledWith(mockUser.email, mockUser.username);
  });

  // -------------------------------------------------------------------------
  // Test 2: Email send failure does NOT affect response (fire-and-forget)
  // ResendService always returns false on failure (never rejects) — simulate that.
  // -------------------------------------------------------------------------
  it('still returns { ok: true } even when sendBusinessWelcomeEmail returns false', async () => {
    resendService.sendBusinessWelcomeEmail.mockResolvedValueOnce(false);

    const result = await controller.welcomeBusiness(mockUser);

    expect(result).toEqual({ ok: true });
  });

  // -------------------------------------------------------------------------
  // Test 3: Uses username when available, falls back to email
  // -------------------------------------------------------------------------
  it('falls back to email when username is empty', async () => {
    const userWithoutUsername = { ...mockUser, username: '' } as unknown as User;

    await controller.welcomeBusiness(userWithoutUsername);

    await new Promise(r => setImmediate(r));

    expect(resendService.sendBusinessWelcomeEmail).toHaveBeenCalledWith(
      userWithoutUsername.email,
      userWithoutUsername.email,
    );
  });
});
