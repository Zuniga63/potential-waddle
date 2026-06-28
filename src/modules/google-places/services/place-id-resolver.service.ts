import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { EnvironmentVariables } from 'src/config/app-config';

type ResolvableEntity = Lodging | Restaurant | Commerce;

/**
 * Returns a Google Maps URL from a place_id.
 * // NEEDS-VERIFICATION against Apify actor — verify that
 * // `https://www.google.com/maps/place/?q=place_id:{id}` is accepted as a
 * // startUrl by the compass~Google-Maps-Reviews-Scraper actor before using
 * // this helper in production sync flows.
 */
export function placeIdToMapsUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

/**
 * Validates that a URL is a Google Maps place link of the shape the onboarding
 * Places picker generates — NOT just any non-empty string. The picker stores
 * either Google's `googleMapsUri` (`https://maps.google.com/?cid=<digits>`) or
 * the `https://www.google.com/maps/place/?q=place_id:ChIJ...` fallback.
 *
 * Accepts a Google Maps host that carries a place identifier (numeric `cid`,
 * a `place_id:` token, or a `/maps/place` path). Rejects arbitrary URLs, non-
 * Google hosts, and Google URLs with no place reference. This is a FORMAT gate
 * (blocks junk input); it cannot verify the link points to the correct business.
 */
export function isPlacesGeneratedUrl(url?: string | null): boolean {
  if (!url) return false;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;

  const host = u.hostname.toLowerCase();
  const isMapsHost =
    host === 'maps.google.com' ||
    ((host === 'www.google.com' || host === 'google.com') && u.pathname.startsWith('/maps'));
  if (!isMapsHost) return false;

  const cid = u.searchParams.get('cid');
  const hasCid = !!cid && /^\d+$/.test(cid);
  const hasPlaceId = url.includes('place_id:') || u.searchParams.has('place_id');
  const hasPlacePath = u.pathname.includes('/maps/place');
  return hasCid || hasPlaceId || hasPlacePath;
}

/**
 * Extracts a STABLE place identifier from a Google Maps URL so two URLs that
 * point at the same place compare equal regardless of tracking/query noise.
 * Google appends volatile params (e.g. `&g_mp=...`) and the host/casing can
 * vary, so a raw string comparison is unreliable for "did the place change?".
 *
 * Resolution order: `place_id:<token>` / `place_id=<token>` → `cid=<digits>`.
 * Returns null when no place identifier can be extracted — callers MUST treat a
 * null key as "not comparable" and never trigger a destructive wipe on a guess.
 */
export function placeKeyFromMapsUrl(url?: string | null): string | null {
  if (!url) return null;
  // place_id can appear as a `q=place_id:ChIJ...` token or a `place_id=` param
  const tokenMatch = url.match(/place_id[:=]([A-Za-z0-9_-]+)/);
  if (tokenMatch) return `place_id:${tokenMatch[1]}`;
  try {
    const u = new URL(url.trim());
    const cid = u.searchParams.get('cid');
    if (cid && /^\d+$/.test(cid)) return `cid:${cid}`;
  } catch {
    // unparseable URL → not comparable
  }
  return null;
}

@Injectable()
export class PlaceIdResolverService {
  private readonly logger = new Logger(PlaceIdResolverService.name);
  private readonly placesApiKey: string | undefined;
  private readonly placesSearchUrl = 'https://places.googleapis.com/v1/places:searchText';

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService<EnvironmentVariables>,
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
  ) {
    this.placesApiKey = configService.get('googlePlaces.apiKey', { infer: true });
  }

  /**
   * Resolves a Google place_id for the given entity using a three-step strategy:
   *  1. Return cached googleMapsId if already set (no API call).
   *  2. Extract place_id from the entity's googleMapsUrl via Places text search.
   *  3. Build a multi-tenant text query: "{name}, {town}, {department}, Colombia".
   * Throws 'place_id_not_resolvable' when none of the above succeeds.
   *
   * @param entity   The business entity to resolve.
   * @param entityType  Discriminates the repository used for persisting the resolved id.
   */
  async resolve(entity: ResolvableEntity, entityType: 'lodging' | 'restaurant' | 'commerce' = 'lodging'): Promise<string> {
    // Step 1: Cache hit — return the stored place_id immediately
    if (entity.googleMapsId) {
      return entity.googleMapsId;
    }

    // Step 2: Extract from URL
    if (entity.googleMapsUrl) {
      const placeId = await this.extractFromUrl(entity.googleMapsUrl);
      if (placeId) {
        await this.persistPlaceId(entity, placeId, entityType);
        return placeId;
      }
    }

    // Step 3: Multi-tenant text search using real town + department
    const town = (entity as ResolvableEntity & { town?: { name?: string; department?: { name?: string } } }).town;
    if (town?.name && town?.department?.name) {
      const textQuery = `${entity.name}, ${town.name}, ${town.department.name}, Colombia`;
      const placeId = await this.searchByText(textQuery);
      if (placeId) {
        await this.persistPlaceId(entity, placeId, entityType);
        return placeId;
      }
    }

    throw new Error('place_id_not_resolvable');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async extractFromUrl(googleMapsUrl: string): Promise<string | null> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          this.placesSearchUrl,
          { textQuery: googleMapsUrl },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': this.placesApiKey,
              'X-Goog-FieldMask': 'places.id',
            },
          },
        ),
      );

      if (response.data.places && response.data.places.length > 0) {
        this.logger.log(`Place ID extracted from URL: ${response.data.places[0].id}`);
        return response.data.places[0].id as string;
      }

      this.logger.warn(`No place_id found for URL: ${googleMapsUrl}`);
      return null;
    } catch (error) {
      this.logger.error(`Error extracting place_id from URL: ${error.message}`);
      return null;
    }
  }

  private async searchByText(textQuery: string): Promise<string | null> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          this.placesSearchUrl,
          { textQuery },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': this.placesApiKey,
              'X-Goog-FieldMask': 'places.id',
            },
          },
        ),
      );

      if (response.data.places && response.data.places.length > 0) {
        this.logger.log(`Place ID found by text search: ${response.data.places[0].id}`);
        return response.data.places[0].id as string;
      }

      this.logger.warn(`No place_id found for text query: ${textQuery}`);
      return null;
    } catch (error) {
      this.logger.error(`Error searching place_id by text: ${error.message}`);
      return null;
    }
  }

  private async persistPlaceId(
    entity: ResolvableEntity,
    placeId: string,
    entityType: 'lodging' | 'restaurant' | 'commerce',
  ): Promise<void> {
    entity.googleMapsId = placeId;

    if (entityType === 'lodging') {
      await this.lodgingRepository.save(entity as Lodging);
    } else if (entityType === 'restaurant') {
      await this.restaurantRepository.save(entity as Restaurant);
    } else if (entityType === 'commerce') {
      await this.commerceRepository.save(entity as Commerce);
    }

    this.logger.log(`Cached place_id ${placeId} for entity ${entity.id}`);
  }
}
