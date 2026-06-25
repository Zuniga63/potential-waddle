import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { EnvironmentVariables } from 'src/config/app-config';
import { FetchedReview, GoogleReviewsSourceService } from '../interfaces/google-reviews-source.interface';

// ---------------------------------------------------------------------------
// Pure helpers — exported so they are unit-testable without HTTP / DI
// ---------------------------------------------------------------------------

export interface ApifyRawItem {
  reviewId: string;
  name: string;
  stars: number;
  text: string;
  reviewUrl: string;
  publishedAtDate: string | Date;
  [key: string]: unknown;
}

/**
 * Maps a raw Apify scraper item to the canonical FetchedReview shape.
 * stars → rating, name → authorName, publishedAtDate → reviewDate.
 */
export function mapApifyItem(raw: ApifyRawItem): FetchedReview {
  return {
    reviewId: raw.reviewId,
    authorName: raw.name,
    rating: raw.stars,
    text: raw.text,
    reviewUrl: raw.reviewUrl,
    reviewDate: raw.publishedAtDate,
  };
}

export interface ApifyPayload {
  startUrls: Array<{ url: string }>;
  reviewsSort: string;
  reviewsCount: number;
  language: string;
  reviewsStartDate?: string;
}

/**
 * Builds the Apify actor input payload.
 * When `since` is provided (incremental), includes reviewsStartDate and limits to 100.
 * When `since` is null (full pull), fetches up to 1000 reviews.
 */
export function buildApifyPayload(placeUrl: string, since: Date | null | undefined): ApifyPayload {
  const base: ApifyPayload = {
    startUrls: [{ url: placeUrl }],
    reviewsSort: 'newest',
    reviewsCount: since ? 100 : 1000,
    language: 'es',
  };

  if (since) {
    base.reviewsStartDate = since.toISOString();
  }

  return base;
}

// ---------------------------------------------------------------------------
// Injectable service
// ---------------------------------------------------------------------------

@Injectable()
export class ApifyReviewsService implements GoogleReviewsSourceService {
  private readonly logger = new Logger(ApifyReviewsService.name);
  private readonly apifyToken: string | undefined;

  private readonly APIFY_RUN_URL =
    'https://api.apify.com/v2/acts/compass~Google-Maps-Reviews-Scraper/runs';

  constructor(configService: ConfigService<EnvironmentVariables>) {
    this.apifyToken = configService.get('apify.apiKey', { infer: true });
  }

  async fetchReviews(placeUrl: string, since?: Date | null): Promise<FetchedReview[]> {
    const payload = buildApifyPayload(placeUrl, since ?? null);

    const runUrl = `${this.APIFY_RUN_URL}?token=${this.apifyToken}`;

    // Step 1: Launch the actor run
    let runId: string;
    try {
      const { data } = await axios.post(runUrl, payload, { timeout: 10_000 });
      runId = data.data.id;
      this.logger.log(`Apify run launched. RunID: ${runId}`);
    } catch (err) {
      this.logger.error('Error launching Apify actor:', err.response?.data || err.message);
      throw new Error('Error launching Apify actor run');
    }

    // Step 2: Poll run status
    let statusRes: { data: { data: { status: string; defaultDatasetId?: string; outputDatasetId?: string } } } | undefined;
    for (let i = 0; i < 20; i++) {
      try {
        statusRes = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${this.apifyToken}`);
        const runStatus = statusRes!.data.data.status;
        this.logger.log(`Apify run status: ${runStatus}`);
        if (runStatus === 'SUCCEEDED') break;
      } catch (err) {
        this.logger.warn('Error polling Apify run status:', err.message);
      }
      await new Promise(res => setTimeout(res, 5_000));
    }

    if (statusRes?.data?.data?.status !== 'SUCCEEDED') {
      throw new Error('Apify actor run timed out');
    }

    // Step 3: Fetch dataset items
    const datasetId = statusRes.data.data.defaultDatasetId || statusRes.data.data.outputDatasetId;
    if (!datasetId) {
      throw new Error('Could not obtain Apify dataset ID');
    }

    this.logger.log(`Fetching dataset: ${datasetId}`);

    try {
      const response = await axios.get(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${this.apifyToken}&clean=true`,
      );
      const rawItems: ApifyRawItem[] = response.data;
      this.logger.log(`Fetched ${rawItems.length} reviews from Apify`);
      return rawItems.map(mapApifyItem);
    } catch (err) {
      this.logger.error('Error fetching Apify dataset items:', err.message);
      throw new Error('Error fetching Apify dataset items');
    }
  }
}
