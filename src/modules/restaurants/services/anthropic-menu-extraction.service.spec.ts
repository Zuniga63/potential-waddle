/**
 * Mocked-Anthropic unit spec for AnthropicMenuExtractionService.
 *
 * Covers:
 *   EXTRACT-08 — stop_reason max_tokens → throws (never returned as completed)
 *   EXTRACT-06 — confidence fields present in sidecar, stripped from data
 *
 * No real API key or network required — Anthropic SDK is fully mocked.
 */

// Mock the Anthropic SDK BEFORE any imports that pull it in
jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
  // Expose mockCreate so tests can access it via the instance
  (MockAnthropic as unknown as Record<string, unknown>).__mockCreate = mockCreate;
  return { default: MockAnthropic };
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AnthropicMenuExtractionService } from './anthropic-menu-extraction.service';
import { GcpStorageService } from 'src/modules/documents/services/gcp-storage.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fake Express.Multer.File for image tests */
function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    buffer: Buffer.from('fake-image-data'),
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

/** Context for processMenuFile calls */
const ctx = { townSlug: 'dev', restaurantId: 'restaurant-uuid-123' };

/** Fake GCS upload result */
const GCS_RESULT = {
  publicUrl: 'https://storage.googleapis.com/binntu-documents/test.jpg',
  gcpPath: 'documents/dev/restaurants/restaurant-uuid-123/menus/test.jpg',
  fileName: 'test.jpg',
  size: 10,
};

/** Build a fake Anthropic messages.create response */
function makeToolUseResponse(stopReason: string, input: unknown) {
  return {
    stop_reason: stopReason,
    content: [
      {
        type: 'tool_use',
        id: 'toolu_01',
        name: 'extract_menu',
        input,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe('AnthropicMenuExtractionService', () => {
  let service: AnthropicMenuExtractionService;
  let messageCreateSpy: jest.Mock;
  let gcpUploadMock: jest.Mock;

  beforeEach(async () => {
    gcpUploadMock = jest.fn().mockResolvedValue(GCS_RESULT);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnthropicMenuExtractionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({ apiKey: 'test-key', model: 'claude-haiku-4-5' }),
          },
        },
        {
          provide: GcpStorageService,
          useValue: {
            uploadFile: gcpUploadMock,
          },
        },
      ],
    }).compile();

    service = module.get<AnthropicMenuExtractionService>(AnthropicMenuExtractionService);

    // Grab the mock from the service's private anthropic instance
    messageCreateSpy = (service as unknown as { anthropic: { messages: { create: jest.Mock } } }).anthropic.messages
      .create;
    messageCreateSpy.mockReset();
  });

  // -------------------------------------------------------------------------
  // EXTRACT-08: max_tokens → throws (truncated output must never be accepted)
  // -------------------------------------------------------------------------
  it('throws when stop_reason is max_tokens (never returns completed) [EXTRACT-08]', async () => {
    messageCreateSpy.mockResolvedValueOnce(
      makeToolUseResponse('max_tokens', { categories: [], overall_confidence: 50 }),
    );

    await expect(service.processMenuFile(makeFile(), ctx)).rejects.toThrow(/truncated|max_tokens/i);
  });

  // -------------------------------------------------------------------------
  // EXTRACT-06: sidecar shape — confidence stripped from data, present in sidecar
  // -------------------------------------------------------------------------
  it('returns ExtractionResult with confidence stripped from data and present in sidecar [EXTRACT-06]', async () => {
    messageCreateSpy.mockResolvedValueOnce(
      makeToolUseResponse('tool_use', {
        categories: [
          {
            category_name: 'Entradas',
            products: [
              {
                product_name: 'Empanada',
                product_price: 3000,
                product_description: null,
                item_confidence: 90,
              },
            ],
          },
        ],
        overall_confidence: 88,
      }),
    );

    const result = await service.processMenuFile(makeFile(), ctx);

    // item_confidence must be stripped from data products
    expect('item_confidence' in result.data.categories[0].products[0]).toBe(false);

    // overall_confidence must be in sidecar only
    expect(result.overallConfidence).toBe(88);

    // fileUrl must reference the GCS bucket
    expect(result.fileUrl).toContain('binntu-documents');

    // reviewFlags must be an array (may be empty for a high-confidence result)
    expect(Array.isArray(result.reviewFlags)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Review flag: low-confidence item
  // -------------------------------------------------------------------------
  it('pushes a review flag for low-confidence items', async () => {
    messageCreateSpy.mockResolvedValueOnce(
      makeToolUseResponse('tool_use', {
        categories: [
          {
            category_name: 'Platos',
            products: [
              {
                product_name: 'Bandeja Paisa',
                product_price: 28000,
                product_description: null,
                item_confidence: 50, // below 70 threshold
              },
            ],
          },
        ],
        overall_confidence: 55,
      }),
    );

    const result = await service.processMenuFile(makeFile(), ctx);

    expect(result.reviewFlags.some((f) => /low confidence/i.test(f))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Review flag: null-price item
  // -------------------------------------------------------------------------
  it('pushes a review flag for null-price items', async () => {
    messageCreateSpy.mockResolvedValueOnce(
      makeToolUseResponse('tool_use', {
        categories: [
          {
            category_name: 'Bebidas',
            products: [
              {
                product_name: 'Jugo Natural',
                product_price: null,
                product_description: null,
                item_confidence: 80,
              },
            ],
          },
        ],
        overall_confidence: 75,
      }),
    );

    const result = await service.processMenuFile(makeFile(), ctx);

    expect(result.reviewFlags.some((f) => /no price/i.test(f))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // MIME guard: unsupported type must reject before calling Anthropic
  // -------------------------------------------------------------------------
  it('rejects an unsupported mime type before calling anthropic', async () => {
    const zipFile = makeFile({ mimetype: 'application/zip', originalname: 'evil.zip' });

    await expect(service.processMenuFile(zipFile, ctx)).rejects.toThrow(BadRequestException);

    // The Anthropic SDK must NOT have been called
    expect(messageCreateSpy).not.toHaveBeenCalled();
  });
});
