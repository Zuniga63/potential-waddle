/**
 * Unit spec for MenuService.processAndCreate — engine dispatch, retry, idempotency, terminal-state.
 *
 * Covers:
 *   INTEG-01 — anthropic flag writes result.data (frozen MenuData) + fileUrl + status completed
 *   INTEG-02 — engine=anthropic calls AnthropicMenuExtractionService (not Kmizen);
 *              engine=kmizen calls KmizenService (not Anthropic)
 *   INTEG-03 — transient Anthropic error → retry → completed;
 *              permanent error → NOT retried → failed;
 *              exhausted retries → failed; kmizenService never called in anthropic branch
 *   INTEG-04 — idempotency: existing completed menu with same hash → return early, no new row, no extractor
 *   INTEG-05 — any extractor error writes status failed before rethrowing
 *
 * All external deps are mocked — no real API, DB, or network calls.
 */

// ---------------------------------------------------------------------------
// Mock @anthropic-ai/sdk so we can import typed error classes.
// The mock exposes real subclasses of a base error so instanceof checks work.
// ---------------------------------------------------------------------------
jest.mock('@anthropic-ai/sdk', () => {
  class MockAPIError extends Error {
    status: number | undefined;
    constructor(status: number | undefined, _error: unknown, message: string, _headers: unknown) {
      super(message);
      this.status = status;
      this.name = 'APIError';
    }
  }

  class MockRateLimitError extends MockAPIError {
    constructor() {
      super(429, undefined, 'rate limit', {});
      this.name = 'RateLimitError';
    }
  }

  class MockInternalServerError extends MockAPIError {
    constructor() {
      super(500, undefined, 'internal server error', {});
      this.name = 'InternalServerError';
    }
  }

  class MockAPIConnectionError extends MockAPIError {
    constructor() {
      super(undefined, undefined, 'connection error', {});
      this.name = 'APIConnectionError';
    }
  }

  class MockBadRequestError extends MockAPIError {
    constructor() {
      super(400, undefined, 'bad request', {});
      this.name = 'BadRequestError';
    }
  }

  class MockAuthenticationError extends MockAPIError {
    constructor() {
      super(401, undefined, 'authentication error', {});
      this.name = 'AuthenticationError';
    }
  }

  return {
    RateLimitError: MockRateLimitError,
    InternalServerError: MockInternalServerError,
    APIConnectionError: MockAPIConnectionError,
    BadRequestError: MockBadRequestError,
    AuthenticationError: MockAuthenticationError,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

import type {
  RateLimitError,
  InternalServerError,
  APIConnectionError,
  BadRequestError,
  AuthenticationError,
} from '@anthropic-ai/sdk';

// Grab the mock constructors at runtime (they have no-arg constructors per the jest.mock factory above)
const {
  RateLimitError: MockRateLimitError,
  InternalServerError: MockInternalServerError,
  APIConnectionError: MockAPIConnectionError,
  BadRequestError: MockBadRequestError,
  AuthenticationError: MockAuthenticationError,
} = jest.requireMock('@anthropic-ai/sdk') as {
  RateLimitError: new () => RateLimitError;
  InternalServerError: new () => InternalServerError;
  APIConnectionError: new () => APIConnectionError;
  BadRequestError: new () => BadRequestError;
  AuthenticationError: new () => AuthenticationError;
};

import { MenuService } from './menu.service';
import { KmizenService } from './kmizen.service';
import { AnthropicMenuExtractionService } from './anthropic-menu-extraction.service';
import { Menu } from '../entities/menu.entity';
import { Restaurant } from '../entities/restaurant.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Multer file */
function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    buffer: Buffer.from('fake-menu-data'),
    originalname: 'menu.jpg',
    mimetype: 'image/jpeg',
    size: 100,
    fieldname: 'file',
    encoding: '7bit',
    stream: null as unknown as NodeJS.ReadableStream,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  } as Express.Multer.File;
}

/** Frozen MenuData shape returned by Anthropic extraction */
const FROZEN_MENU_DATA = {
  restaurant_name: 'El Rancho',
  currency: 'COP',
  notes: null,
  categories: [
    {
      category_name: 'Entradas',
      products: [{ product_name: 'Empanada', product_price: 3000, product_description: null }],
    },
  ],
};

const ANTHROPIC_RESULT = {
  data: FROZEN_MENU_DATA,
  fileUrl: 'https://storage.googleapis.com/binntu/menus/test.jpg',
  overallConfidence: 88,
  reviewFlags: [],
};

const KMIZEN_RESULT = {
  data: { extracted_data: { categories: [] }, other: 'field' },
  fileUrl: null,
};

const RESTAURANT_ID = 'restaurant-uuid-123';
const MENU_ID = 'menu-uuid-456';

/** Build a fake restaurant with a town */
function makeRestaurant(townSlug = 'sanrafael') {
  return {
    id: RESTAURANT_ID,
    town: { id: 'town-uuid', slug: townSlug },
  } as unknown as Restaurant;
}

/** Build a fake saved menu (processing state) */
function makeProcessingMenu(): Partial<Menu> & { id: string; status: string; fileHash: string | null } {
  return {
    id: MENU_ID,
    status: 'processing',
    fileHash: null,
    data: null,
    fileUrl: null,
    fileName: 'menu.jpg',
    mimeType: 'image/jpeg',
    restaurant: makeRestaurant() as unknown as Restaurant,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Menu & { id: string; status: string; fileHash: string | null };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe('MenuService', () => {
  let service: MenuService;

  // Repository mocks
  let menuFindOneMock: jest.Mock;
  let menuCreateMock: jest.Mock;
  let menuSaveMock: jest.Mock;
  let restaurantFindOneMock: jest.Mock;

  // Service mocks
  let anthropicProcessMenuFileMock: jest.Mock;
  let kmizenProcessMenuFileMock: jest.Mock;

  // ConfigService mock — engine can be changed per describe block
  let configGetMock: jest.Mock;

  beforeEach(async () => {
    jest.useFakeTimers();

    menuFindOneMock = jest.fn();
    menuCreateMock = jest.fn();
    menuSaveMock = jest.fn();
    restaurantFindOneMock = jest.fn();
    anthropicProcessMenuFileMock = jest.fn();
    kmizenProcessMenuFileMock = jest.fn();
    configGetMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getRepositoryToken(Menu),
          useValue: {
            findOne: menuFindOneMock,
            find: jest.fn().mockResolvedValue([]),
            create: menuCreateMock,
            save: menuSaveMock,
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Restaurant),
          useValue: {
            findOne: restaurantFindOneMock,
            save: jest.fn().mockImplementation((r) => Promise.resolve(r)),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: configGetMock,
          },
        },
        {
          provide: KmizenService,
          useValue: {
            processMenuFile: kmizenProcessMenuFileMock,
          },
        },
        {
          provide: AnthropicMenuExtractionService,
          useValue: {
            processMenuFile: anthropicProcessMenuFileMock,
          },
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // Helper: set up the happy-path foundation
  function setupFoundation(engine: 'anthropic' | 'kmizen' = 'anthropic') {
    // configService returns engine config
    configGetMock.mockReturnValue({ engine, model: 'claude-haiku-4-5' });

    // Restaurant found with town relation
    restaurantFindOneMock.mockResolvedValue(makeRestaurant());

    // No existing completed menu (no idempotency hit by default)
    menuFindOneMock.mockResolvedValue(null);

    // Create returns the processing menu object
    const processingMenu = makeProcessingMenu();
    menuCreateMock.mockReturnValue(processingMenu);

    // First save (processing row creation) resolves to processing menu
    // Subsequent saves (status update) resolve to the same object with mutation
    menuSaveMock.mockImplementation(async (menu) => {
      if (menu && typeof menu === 'object') return { ...menu, id: MENU_ID };
      return menu;
    });
  }

  // ---------------------------------------------------------------------------
  // INTEG-01: anthropic flag writes frozen MenuData + fileUrl + status completed
  // ---------------------------------------------------------------------------
  describe('INTEG-01: anthropic engine writes correct data/fileUrl/status', () => {
    it('sets savedMenu.data = result.data (frozen MenuData, no extracted_data unwrap) and status completed', async () => {
      setupFoundation('anthropic');
      anthropicProcessMenuFileMock.mockResolvedValue(ANTHROPIC_RESULT);

      const file = makeFile();
      const dto = await service.processAndCreate(RESTAURANT_ID, file);

      // Status must be completed
      expect(dto.status).toBe('completed');

      // The last save call must have had data = FROZEN_MENU_DATA (direct assignment, no extracted_data)
      const lastSaveCall = menuSaveMock.mock.calls[menuSaveMock.mock.calls.length - 1][0];
      expect(lastSaveCall.data).toEqual(FROZEN_MENU_DATA);
      expect(lastSaveCall.fileUrl).toBe(ANTHROPIC_RESULT.fileUrl);
    });

    it('does NOT assign overallConfidence or reviewFlags into menu.data (D-06)', async () => {
      setupFoundation('anthropic');
      anthropicProcessMenuFileMock.mockResolvedValue({
        ...ANTHROPIC_RESULT,
        overallConfidence: 72,
        reviewFlags: ['Low confidence on: Sopa'],
      });

      await service.processAndCreate(RESTAURANT_ID, makeFile());

      const lastSaveCall = menuSaveMock.mock.calls[menuSaveMock.mock.calls.length - 1][0];
      expect(lastSaveCall.data).not.toHaveProperty('overallConfidence');
      expect(lastSaveCall.data).not.toHaveProperty('reviewFlags');
    });
  });

  // ---------------------------------------------------------------------------
  // INTEG-02: dispatch — anthropic calls Anthropic; kmizen calls Kmizen
  // ---------------------------------------------------------------------------
  describe('INTEG-02: engine dispatch', () => {
    it('engine=anthropic calls AnthropicMenuExtractionService.processMenuFile with {townSlug, restaurantId} and NOT KmizenService', async () => {
      setupFoundation('anthropic');
      anthropicProcessMenuFileMock.mockResolvedValue(ANTHROPIC_RESULT);

      await service.processAndCreate(RESTAURANT_ID, makeFile());

      expect(anthropicProcessMenuFileMock).toHaveBeenCalledTimes(1);
      expect(anthropicProcessMenuFileMock).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'menu.jpg' }),
        { townSlug: 'sanrafael', restaurantId: RESTAURANT_ID },
      );
      expect(kmizenProcessMenuFileMock).not.toHaveBeenCalled();
    });

    it('engine=kmizen calls KmizenService.processMenuFile and NOT AnthropicMenuExtractionService', async () => {
      setupFoundation('kmizen');
      kmizenProcessMenuFileMock.mockResolvedValue(KMIZEN_RESULT);

      await service.processAndCreate(RESTAURANT_ID, makeFile());

      expect(kmizenProcessMenuFileMock).toHaveBeenCalledTimes(1);
      expect(anthropicProcessMenuFileMock).not.toHaveBeenCalled();
    });

    it('engine=kmizen maps result.data?.extracted_data ?? result.data', async () => {
      setupFoundation('kmizen');
      const kmizenResult = { data: { extracted_data: { categories: [{ category_name: 'A' }] } }, fileUrl: null };
      kmizenProcessMenuFileMock.mockResolvedValue(kmizenResult);

      await service.processAndCreate(RESTAURANT_ID, makeFile());

      const lastSaveCall = menuSaveMock.mock.calls[menuSaveMock.mock.calls.length - 1][0];
      expect(lastSaveCall.data).toEqual(kmizenResult.data.extracted_data);
    });

    it('townSlug falls back to "unknown" when restaurant has no town', async () => {
      configGetMock.mockReturnValue({ engine: 'anthropic', model: 'claude-haiku-4-5' });
      restaurantFindOneMock.mockResolvedValue({ id: RESTAURANT_ID, town: null });
      menuFindOneMock.mockResolvedValue(null);
      menuCreateMock.mockReturnValue(makeProcessingMenu());
      menuSaveMock.mockImplementation(async (m) => ({ ...m, id: MENU_ID }));
      anthropicProcessMenuFileMock.mockResolvedValue(ANTHROPIC_RESULT);

      await service.processAndCreate(RESTAURANT_ID, makeFile());

      expect(anthropicProcessMenuFileMock).toHaveBeenCalledWith(
        expect.anything(),
        { townSlug: 'unknown', restaurantId: RESTAURANT_ID },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // INTEG-03: retry semantics — transient errors retry; permanent do not;
  //           exhausted retries → failed; kmizen NEVER called in anthropic branch
  // ---------------------------------------------------------------------------
  describe('INTEG-03: retry and no-fallback', () => {
    it('retries on RateLimitError (transient) then resolves → status completed; kmizen not called', async () => {
      setupFoundation('anthropic');

      // First call throws transient, second resolves
      anthropicProcessMenuFileMock
        .mockRejectedValueOnce(new MockRateLimitError())
        .mockResolvedValueOnce(ANTHROPIC_RESULT);

      const promise = service.processAndCreate(RESTAURANT_ID, makeFile());

      // Advance timers past the 1s retry delay (attempt 1 * RETRY_DELAY_MS)
      await jest.runAllTimersAsync();

      const dto = await promise;

      expect(dto.status).toBe('completed');
      expect(anthropicProcessMenuFileMock).toHaveBeenCalledTimes(2);
      expect(kmizenProcessMenuFileMock).not.toHaveBeenCalled();
    });

    it('retries on InternalServerError (transient) then resolves → completed', async () => {
      setupFoundation('anthropic');

      anthropicProcessMenuFileMock
        .mockRejectedValueOnce(new MockInternalServerError())
        .mockResolvedValueOnce(ANTHROPIC_RESULT);

      const promise = service.processAndCreate(RESTAURANT_ID, makeFile());
      await jest.runAllTimersAsync();
      const dto = await promise;

      expect(dto.status).toBe('completed');
      expect(anthropicProcessMenuFileMock).toHaveBeenCalledTimes(2);
    });

    it('retries on APIConnectionError (transient) then resolves → completed', async () => {
      setupFoundation('anthropic');

      anthropicProcessMenuFileMock
        .mockRejectedValueOnce(new MockAPIConnectionError())
        .mockResolvedValueOnce(ANTHROPIC_RESULT);

      const promise = service.processAndCreate(RESTAURANT_ID, makeFile());
      await jest.runAllTimersAsync();
      const dto = await promise;

      expect(dto.status).toBe('completed');
      expect(anthropicProcessMenuFileMock).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on BadRequestError (permanent) — anthropic called exactly once → status failed', async () => {
      setupFoundation('anthropic');

      const permanentError = new MockBadRequestError();
      anthropicProcessMenuFileMock.mockRejectedValue(permanentError);

      await expect(service.processAndCreate(RESTAURANT_ID, makeFile())).rejects.toThrow(MockBadRequestError);

      // Only one attempt
      expect(anthropicProcessMenuFileMock).toHaveBeenCalledTimes(1);

      // status failed written before rethrow (INTEG-05)
      const failSaveCall = menuSaveMock.mock.calls.find((call) => call[0]?.status === 'failed');
      expect(failSaveCall).toBeDefined();

      // kmizen must NOT have been called (no fallback)
      expect(kmizenProcessMenuFileMock).not.toHaveBeenCalled();
    });

    it('does NOT retry on AuthenticationError (permanent) — called once → status failed', async () => {
      setupFoundation('anthropic');

      anthropicProcessMenuFileMock.mockRejectedValue(new MockAuthenticationError());

      await expect(service.processAndCreate(RESTAURANT_ID, makeFile())).rejects.toThrow(MockAuthenticationError);

      expect(anthropicProcessMenuFileMock).toHaveBeenCalledTimes(1);
      expect(kmizenProcessMenuFileMock).not.toHaveBeenCalled();
    });

    it('exhausts MAX_ATTEMPTS on transient error → status failed; kmizen NEVER called (no fallback)', async () => {
      setupFoundation('anthropic');

      // All attempts throw transient
      anthropicProcessMenuFileMock
        .mockRejectedValueOnce(new MockRateLimitError())
        .mockRejectedValueOnce(new MockRateLimitError());

      // Attach the rejection handler BEFORE advancing timers to avoid unhandled rejection
      const expectPromise = expect(service.processAndCreate(RESTAURANT_ID, makeFile())).rejects.toThrow(
        MockRateLimitError,
      );
      await jest.runAllTimersAsync();
      await expectPromise;

      // Both attempts made
      expect(anthropicProcessMenuFileMock).toHaveBeenCalledTimes(2);

      // status failed written
      const failSaveCall = menuSaveMock.mock.calls.find((call) => call[0]?.status === 'failed');
      expect(failSaveCall).toBeDefined();

      // kmizen NEVER called — no automatic fallback (D-03/INTEG-03)
      expect(kmizenProcessMenuFileMock).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // INTEG-04: idempotency — existing completed menu returns early; no new row
  // ---------------------------------------------------------------------------
  describe('INTEG-04: idempotency by restaurantId + fileHash', () => {
    it('returns existing completed menu without calling any extractor or creating a new row', async () => {
      configGetMock.mockReturnValue({ engine: 'anthropic', model: 'claude-haiku-4-5' });
      restaurantFindOneMock.mockResolvedValue(makeRestaurant());

      // The idempotency lookup returns an existing completed menu
      const existingMenu = {
        ...makeProcessingMenu(),
        status: 'completed',
        data: FROZEN_MENU_DATA,
        fileUrl: 'https://existing-url.com/menu.jpg',
        restaurant: makeRestaurant(),
      } as unknown as Menu;
      menuFindOneMock.mockResolvedValue(existingMenu);

      const dto = await service.processAndCreate(RESTAURANT_ID, makeFile());

      // Returned the existing completed menu
      expect(dto.status).toBe('completed');

      // No extractor called
      expect(anthropicProcessMenuFileMock).not.toHaveBeenCalled();
      expect(kmizenProcessMenuFileMock).not.toHaveBeenCalled();

      // menuRepository.create must NOT have been called (no new processing row)
      expect(menuCreateMock).not.toHaveBeenCalled();

      // menuRepository.save must NOT have been called (no new row persisted)
      expect(menuSaveMock).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // INTEG-05: terminal status — any extractor error writes status failed
  // ---------------------------------------------------------------------------
  describe('INTEG-05: terminal status on every error path', () => {
    it('writes status failed and saves before rethrowing on an unexpected error', async () => {
      setupFoundation('anthropic');

      const unexpectedError = new Error('Unexpected network failure');
      anthropicProcessMenuFileMock.mockRejectedValue(unexpectedError);

      await expect(service.processAndCreate(RESTAURANT_ID, makeFile())).rejects.toThrow('Unexpected network failure');

      // A save with status failed must have been called
      const failSaveCall = menuSaveMock.mock.calls.find((call) => call[0]?.status === 'failed');
      expect(failSaveCall).toBeDefined();
    });

    it('writes status failed on kmizen error and rethrows', async () => {
      setupFoundation('kmizen');

      const kmizenError = new Error('Kmizen API 401');
      kmizenProcessMenuFileMock.mockRejectedValue(kmizenError);

      await expect(service.processAndCreate(RESTAURANT_ID, makeFile())).rejects.toThrow('Kmizen API 401');

      const failSaveCall = menuSaveMock.mock.calls.find((call) => call[0]?.status === 'failed');
      expect(failSaveCall).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge case: restaurant not found → NotFoundException
  // ---------------------------------------------------------------------------
  describe('processAndCreate edge cases', () => {
    it('throws NotFoundException when restaurant does not exist', async () => {
      configGetMock.mockReturnValue({ engine: 'anthropic' });
      restaurantFindOneMock.mockResolvedValue(null);
      menuFindOneMock.mockResolvedValue(null);

      await expect(service.processAndCreate('nonexistent-id', makeFile())).rejects.toThrow(NotFoundException);
    });
  });
});
