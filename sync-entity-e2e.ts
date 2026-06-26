/**
 * THROWAWAY end-to-end script — DO NOT COMMIT
 *
 * Calls GoogleSyncService.syncEntity() against a real DB and real Apify actor.
 * Required env vars (from .env or exported in shell):
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *   APIFY_API_KEY
 *   GOOGLE_PLACES_API_KEY  (used by PlaceIdResolverService)
 *   (optional) GOOGLE_REVIEWS_START_DATE  — ISO date, e.g. "2024-01-01"
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register sync-entity-e2e.ts <lodging-id>
 *
 * Example:
 *   ts-node -r tsconfig-paths/register sync-entity-e2e.ts "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
 *
 * What it does:
 *   1. Connects directly to the TypeORM DataSource (same connection-source.ts used by migrations)
 *   2. Instantiates PlaceIdResolverService + ApifyReviewsService + GoogleSyncService manually
 *   3. Calls syncEntity(id, 'lodging', 'manual') once
 *   4. Prints the resulting sync-log row to stdout
 *   5. Pauses 3 s, then calls syncEntity a SECOND time (idempotency check)
 *   6. Prints both log rows and the computed AVG rating vs stored rating
 */

import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env' });

import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { AxiosHeaders } from 'axios';
import * as axiosLib from 'axios';

// ---- entities ----
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { GoogleReview } from 'src/modules/google-places/entities/google-review.entity';
import { GoogleReviewSyncLog } from 'src/modules/google-places/entities/google-review-sync-log.entity';
import { Town } from 'src/modules/towns/entities/town.entity';
import { Department } from 'src/modules/towns/entities/department.entity';

// ---- services ----
import { PlaceIdResolverService } from 'src/modules/google-places/services/place-id-resolver.service';
import { ApifyReviewsService } from 'src/modules/google-places/services/apify-reviews.service';
import { GoogleSyncService } from 'src/modules/google-places/services/google-sync.service';
import { GOOGLE_REVIEWS_SOURCE } from 'src/modules/google-places/interfaces/google-reviews-source.interface';

const ENTITY_ID = process.argv[2];
const ENTITY_TYPE = 'lodging' as const;

if (!ENTITY_ID) {
  console.error('\nUsage: ts-node -r tsconfig-paths/register sync-entity-e2e.ts <lodging-id>\n');
  process.exit(1);
}

async function main() {
  console.log('=== sync-entity-e2e.ts ===');
  console.log(`Entity: ${ENTITY_TYPE} id=${ENTITY_ID}`);

  // ---- 1. Connect to DB ----
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5435', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'MyPassword',
    database: process.env.DB_NAME || 'Binntu',
    // Glob ALL src entities so related metadata (e.g. Commerce -> Category) resolves.
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
  });

  await ds.initialize();
  console.log('DB connected.');

  // ---- 2. Build a minimal HttpService shim ----
  const axiosInstance = axiosLib.default.create();
  const httpService = new HttpService(axiosInstance);

  // ---- 3. Instantiate services ----
  // Minimal ConfigService shim — resolves the two nested keys the services read.
  const configShim = {
    get: (key: string) => {
      const m: Record<string, string | undefined> = {
        'apify.apiKey': process.env.APIFY_API_KEY,
        'googlePlaces.apiKey': process.env.GOOGLE_PLACES_API_KEY,
      };
      return m[key];
    },
  } as any;

  const placeIdResolver = new PlaceIdResolverService(
    httpService,
    configShim,
    ds.getRepository(Lodging),
    ds.getRepository(Restaurant),
    ds.getRepository(Commerce),
  );

  const apifyService = new ApifyReviewsService(configShim);

  // GoogleSyncService constructor signature (from source):
  //   (dataSource, syncLogRepo, lodgingRepo, restaurantRepo, commerceRepo, placeIdResolver, source)
  const googleSyncService = new GoogleSyncService(
    ds,
    ds.getRepository(GoogleReviewSyncLog),
    ds.getRepository(Lodging),
    ds.getRepository(Restaurant),
    ds.getRepository(Commerce),
    placeIdResolver,
    apifyService,
  );

  // ---- 4. First invocation ----
  console.log('\n--- RUN 1: syncEntity ---');
  await googleSyncService.syncEntity(ENTITY_ID, ENTITY_TYPE, 'manual');

  const log1 = await ds
    .getRepository(GoogleReviewSyncLog)
    .createQueryBuilder('l')
    .where('l.entityId = :id AND l.entityType = :type', { id: ENTITY_ID, type: ENTITY_TYPE })
    .orderBy('l.startedAt', 'DESC')
    .getOne();

  console.log('Sync log after RUN 1:', JSON.stringify(log1, null, 2));

  const count1 = await ds
    .getRepository(GoogleReview)
    .count({ where: { entityId: ENTITY_ID, entityType: ENTITY_TYPE } });
  console.log(`google_review count after RUN 1: ${count1}`);

  const entity1 = await ds.getRepository(Lodging).findOne({ where: { id: ENTITY_ID } });
  console.log(`lodging.googleMapsRating=${entity1?.googleMapsRating}  lastGoogleSyncAt=${entity1?.lastGoogleSyncAt}`);

  // ---- 5. Wait 3 s, then second invocation ----
  console.log('\nWaiting 3 s before RUN 2...');
  await new Promise((r) => setTimeout(r, 3000));

  console.log('\n--- RUN 2: syncEntity (idempotency check) ---');
  await googleSyncService.syncEntity(ENTITY_ID, ENTITY_TYPE, 'manual');

  const count2 = await ds
    .getRepository(GoogleReview)
    .count({ where: { entityId: ENTITY_ID, entityType: ENTITY_TYPE } });
  console.log(`google_review count after RUN 2: ${count2}`);

  if (count1 === count2) {
    console.log('IDEMPOTENCY: PASS — count unchanged (no duplicates).');
  } else {
    console.warn(`IDEMPOTENCY: WARN — count changed from ${count1} to ${count2}. Investigate UPSERT.`);
  }

  // AVG rating check
  const avgResult = await ds
    .getRepository(GoogleReview)
    .createQueryBuilder('r')
    .select('AVG(r.rating)', 'avg')
    .where('r.entityId = :id AND r.entityType = :type', { id: ENTITY_ID, type: ENTITY_TYPE })
    .getRawOne<{ avg: string }>();

  const entity2 = await ds.getRepository(Lodging).findOne({ where: { id: ENTITY_ID } });
  const avgDb = parseFloat(avgResult?.avg ?? '0');
  const storedRating = entity2?.googleMapsRating ?? 0;
  const ratingMatch = Math.abs(avgDb - storedRating) < 0.01;

  console.log(`AVG(rating) from google_review: ${avgDb.toFixed(2)}`);
  console.log(`lodging.googleMapsRating stored: ${storedRating}`);
  console.log(`Rating match: ${ratingMatch ? 'PASS' : 'FAIL — denorm drift detected!'}`);
  console.log(`lastGoogleSyncAt: ${entity2?.lastGoogleSyncAt}`);

  const logs = await ds
    .getRepository(GoogleReviewSyncLog)
    .createQueryBuilder('l')
    .where('l.entityId = :id AND l.entityType = :type', { id: ENTITY_ID, type: ENTITY_TYPE })
    .orderBy('l.startedAt', 'DESC')
    .limit(2)
    .getMany();

  console.log('\nLast 2 sync log rows:');
  logs.forEach((l, i) => console.log(`  [${i + 1}]`, JSON.stringify(l)));

  await ds.destroy();
  console.log('\nDone. DB connection closed.');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
