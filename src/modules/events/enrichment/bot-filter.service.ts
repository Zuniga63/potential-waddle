import { Injectable } from '@nestjs/common';
import { isbot } from 'isbot';

/**
 * BotFilterService — wraps the community-maintained `isbot` crawler list (D-10).
 * Bot traffic is flagged (`is_bot=true`) and persisted so dashboards can audit
 * crawler volume while excluding it from metrics — it is never dropped at ingest.
 */
@Injectable()
export class BotFilterService {
  isBot(userAgent: string | null | undefined): boolean {
    return isbot(userAgent ?? '');
  }
}
