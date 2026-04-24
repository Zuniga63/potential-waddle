import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/services/users.service';
import { TermsService } from '../terms/services';
import { TermsStatusDto } from '../terms/dto/terms-status.dto';

import { AuthService } from './services/auth.service';
import { SessionService } from './services';
import { ProfileController } from './profile.controller';
import { ProfileResponseDto } from './dto/profile-response.dto';

// * ----------------------------------------------------------------------------------------------------------------
// * ProfileController — Plan 03 Task 1 (extended /auth/profile with termsStatus)
// * ----------------------------------------------------------------------------------------------------------------
describe('ProfileController', () => {
  let controller: ProfileController;
  let usersService: { getFullUser: jest.Mock };
  let termsService: { getStatusForUser: jest.Mock };

  const baseUser = {
    id: 'user-id-1',
    email: 'user1@binntu.test',
    username: 'user1',
    hasPassword: true,
    isSuperUser: false,
    isActive: true,
    totalPoints: 0,
    distanceTravelled: 0,
    country: null,
    countryState: null,
    city: null,
    birthDate: null,
    profilePhoto: null,
    emailVerifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    towns: [],
  } as unknown as User;

  const activeStatus: TermsStatusDto = {
    hasAcceptedUserTerms: true,
    hasAcceptedLodgingTerms: false,
    hasAcceptedRestaurantTerms: false,
    hasAcceptedCommerceTerms: false,
    hasAcceptedTransportTerms: false,
    hasAcceptedGuideTerms: false,
    activeDocumentIds: {
      user: 'doc-user-id',
      lodging: null,
      restaurant: null,
      commerce: null,
      transport: null,
      guide: null,
    },
  };

  beforeEach(async () => {
    usersService = { getFullUser: jest.fn() };
    termsService = { getStatusForUser: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: SessionService, useValue: {} },
        { provide: UsersService, useValue: usersService },
        { provide: TermsService, useValue: termsService },
      ],
    }).compile();

    controller = moduleRef.get(ProfileController);
  });

  describe('getProfile', () => {
    it('returns a ProfileResponseDto with user + termsStatus when user exists', async () => {
      usersService.getFullUser.mockResolvedValue(baseUser);
      termsService.getStatusForUser.mockResolvedValue(activeStatus);

      const result = await controller.getProfile(baseUser);

      expect(result).toBeInstanceOf(ProfileResponseDto);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('user-id-1');
      expect(result.user.email).toBe('user1@binntu.test');
      expect(result.termsStatus).toBe(activeStatus);
    });

    it('queries usersService with the request user email', async () => {
      usersService.getFullUser.mockResolvedValue(baseUser);
      termsService.getStatusForUser.mockResolvedValue(activeStatus);

      await controller.getProfile(baseUser);

      expect(usersService.getFullUser).toHaveBeenCalledWith('user1@binntu.test');
    });

    it('queries termsService with the request user id', async () => {
      usersService.getFullUser.mockResolvedValue(baseUser);
      termsService.getStatusForUser.mockResolvedValue(activeStatus);

      await controller.getProfile(baseUser);

      expect(termsService.getStatusForUser).toHaveBeenCalledWith('user-id-1');
    });

    it('invokes usersService and termsService in parallel via Promise.all', async () => {
      // Resolve termsService first; usersService second. If the controller awaited sequentially,
      // termsService.getStatusForUser would not have been called until after getFullUser settles.
      let termsCalled = false;
      let usersSettledBeforeTerms = false;
      usersService.getFullUser.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              if (!termsCalled) usersSettledBeforeTerms = true;
              resolve(baseUser);
            }, 20);
          }),
      );
      termsService.getStatusForUser.mockImplementation(
        () =>
          new Promise(resolve => {
            termsCalled = true;
            setTimeout(() => resolve(activeStatus), 1);
          }),
      );

      await controller.getProfile(baseUser);

      expect(termsCalled).toBe(true);
      expect(usersSettledBeforeTerms).toBe(false);
    });

    it('throws NotFoundException when usersService returns null', async () => {
      usersService.getFullUser.mockResolvedValue(null);
      termsService.getStatusForUser.mockResolvedValue(activeStatus);

      await expect(controller.getProfile(baseUser)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
