import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { Event } from './entities';

/**
 * EventsCanaryCron (EVENT-08) — zero-event ingestion canary.
 *
 * Lightweight observability (no Datadog, per D-08 discretion): once an hour it
 * counts events ingested in the trailing hour. A count of 0 means tracking is
 * likely broken (client SDK regressed, ingest endpoint down, DB write failing
 * silently) and is logged at WARN level so it surfaces in the logs / alerts.
 *
 * Non-silent by design: combined with the non-silent ingest error logging from
 * Plan 02, this delivers the EVENT-08 observability requirement.
 */
@Injectable()
export class EventsCanaryCron {
  private readonly logger = new Logger(EventsCanaryCron.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkIngestion(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const count = await this.eventsRepository.count({
        where: { createdAt: MoreThanOrEqual(oneHourAgo) },
      });

      if (count === 0) {
        this.logger.warn(
          '(events-canary) ZERO events ingested in the last hour — tracking may be broken',
        );
      }
    } catch (error) {
      // Never silence: if the canary itself fails, log it (e.g. table missing pre-migration).
      this.logger.error(`(events-canary) canary check failed: ${(error as Error).message}`);
    }
  }
}
