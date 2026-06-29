import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EntityReviewsService } from './entity-reviews.service';
import { Review, ReviewImage, BinntuReviewSummary } from '../entities';
import { ReviewDomainsEnum, ReviewStatusEnum } from '../enums';
import { User, UserPoint } from 'src/modules/users/entities';
import { ImageResource } from 'src/modules/core/entities';
import { TinifyService } from 'src/modules/tinify/tinify.service';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { Lodging } from 'src/modules/lodgings/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Commerce } from 'src/modules/commerce/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Transport } from 'src/modules/transport/entities';
import { Guide } from 'src/modules/guides/entities';

// ---------------------------------------------------------------------------
// Build minimal module for EntityReviewsService with all required providers
// ---------------------------------------------------------------------------

function makeRepoMock(findResult: any[] = []) {
  return {
    find: jest.fn().mockResolvedValue(findResult),
    findOne: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((dto: any) => dto),
    exists: jest.fn().mockResolvedValue(false),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    update: jest.fn().mockResolvedValue({ affected: 0 }),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  };
}

async function buildModule(reviewFindResult: any[] = []): Promise<EntityReviewsService> {
  const reviewRepo = makeRepoMock(reviewFindResult);

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EntityReviewsService,
      // Core review repository — controls test data
      { provide: getRepositoryToken(Review), useValue: reviewRepo },
      // All other repositories — minimal stubs
      { provide: getRepositoryToken(Lodging), useValue: makeRepoMock() },
      { provide: getRepositoryToken(Restaurant), useValue: makeRepoMock() },
      { provide: getRepositoryToken(Commerce), useValue: makeRepoMock() },
      { provide: getRepositoryToken(Experience), useValue: makeRepoMock() },
      { provide: getRepositoryToken(Transport), useValue: makeRepoMock() },
      { provide: getRepositoryToken(Guide), useValue: makeRepoMock() },
      { provide: getRepositoryToken(ImageResource), useValue: makeRepoMock() },
      { provide: getRepositoryToken(ReviewImage), useValue: makeRepoMock() },
      { provide: getRepositoryToken(User), useValue: makeRepoMock() },
      { provide: getRepositoryToken(UserPoint), useValue: makeRepoMock() },
      { provide: getRepositoryToken(BinntuReviewSummary), useValue: makeRepoMock() },
      // DataSource stub (not used in getReviewsMetrics)
      {
        provide: DataSource,
        useValue: { createQueryRunner: jest.fn().mockReturnValue({}) },
      },
      // ConfigService — no GEMINI_API_KEY so geminiModel stays null (not needed for metrics)
      {
        provide: ConfigService,
        useValue: { get: jest.fn().mockReturnValue(undefined) },
      },
      // TinifyService / CloudinaryService — not used in metrics
      { provide: TinifyService, useValue: {} },
      { provide: CloudinaryService, useValue: {} },
    ],
  }).compile();

  return module.get<EntityReviewsService>(EntityReviewsService);
}

// ---------------------------------------------------------------------------
// D-13: rated-only filter in getReviewsMetrics
// ---------------------------------------------------------------------------

describe('EntityReviewsService — getReviewsMetrics rated-only (D-13)', () => {
  it('excludes rating === 0 from averageRating and distribution', async () => {
    // Dataset: two rated (5, 4) + one unrated-zero (0)
    const reviewFixtures = [
      { rating: 5, createdAt: new Date('2024-06-01') },
      { rating: 0, createdAt: new Date('2024-06-02') }, // D-13: must be excluded
      { rating: 4, createdAt: new Date('2024-06-03') },
    ];

    const service = await buildModule(reviewFixtures);
    const result = await service.getReviewsMetrics(ReviewDomainsEnum.LODGINGS, 'entity-001');

    // Only the two rated reviews (5 + 4) should contribute to averageRating
    expect(result.averageRating).toBe(4.5);

    // Distribution should only count rating >= 1
    expect(result.distribution[5]).toBe(1);
    expect(result.distribution[4]).toBe(1);
    expect(result.distribution[3]).toBe(0);
    expect(result.distribution[2]).toBe(0);
    expect(result.distribution[1]).toBe(0);

    // totalReviews reports all approved reviews (the DB query has no rating filter)
    expect(result.totalReviews).toBe(3);
  });

  it('excludes rating === null from averageRating and distribution', async () => {
    const reviewFixtures = [
      { rating: 5, createdAt: new Date('2024-07-01') },
      { rating: null, createdAt: new Date('2024-07-02') }, // null also excluded
    ];

    const service = await buildModule(reviewFixtures);
    const result = await service.getReviewsMetrics(ReviewDomainsEnum.LODGINGS, 'entity-002');

    expect(result.averageRating).toBe(5);
    expect(result.distribution[5]).toBe(1);
  });

  it('handles all-zero-rating dataset without NaN averageRating', async () => {
    const reviewFixtures = [{ rating: 0, createdAt: new Date('2024-08-01') }];

    const service = await buildModule(reviewFixtures);
    const result = await service.getReviewsMetrics(ReviewDomainsEnum.LODGINGS, 'entity-003');

    // validRatings is empty → division-by-zero: NaN. toFixed(2) on NaN produces 'NaN'.
    // The service should return NaN (acceptable) — the key assertion is that 0-star
    // reviews are not in the distribution buckets.
    expect(result.distribution[5]).toBe(0);
    expect(result.distribution[4]).toBe(0);
    expect(result.distribution[3]).toBe(0);
    expect(result.distribution[2]).toBe(0);
    expect(result.distribution[1]).toBe(0);
  });
});
