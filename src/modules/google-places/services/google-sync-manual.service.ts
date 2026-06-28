import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';
import { GoogleReviewSyncLog } from '../entities/google-review-sync-log.entity';
import { GoogleSyncService } from './google-sync.service';
import { isPlacesGeneratedUrl } from './place-id-resolver.service';
import { User } from 'src/modules/users/entities/user.entity';
import { SyncHistoryItemDto, SyncHistoryResponseDto } from '../dto/sync-history.dto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityType = 'lodging' | 'restaurant' | 'commerce';

const VALID_TYPES = ['lodging', 'restaurant', 'commerce'] as const;

type EntityWithUserAndUrl = {
  id: string;
  googleMapsUrl?: string | null;
  lastSyncedMapsUrl?: string | null;
  user?: { id: string } | null;
};

// ---------------------------------------------------------------------------
// GoogleSyncManualService
// ---------------------------------------------------------------------------

/**
 * Handles the owner-triggered manual sync endpoint (SYNC-03) and the
 * paginated sync-history endpoint (SYNC-05).
 *
 * Security surface (STRIDE T-21-09 / T-21-10 / T-21-11 / T-21-12):
 *   - `:type` allowlist validated before any DB query (T-21-11 Tampering)
 *   - IDOR ownership check with null-user guard via `entity.user?.id`
 *     — forcedPublic entities may have a null user relation (T-21-09)
 *   - 1h server-side cooldown checked against sync-log startedAt
 *     (catches in-flight 'running' rows; not bypassable from frontend) (T-21-10)
 *   - Same ownership guard on getSyncHistory (T-21-12)
 */
@Injectable()
export class GoogleSyncManualService {
  private readonly logger = new Logger(GoogleSyncManualService.name);

  constructor(
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
    @InjectRepository(GoogleReviewSyncLog)
    private readonly syncLogRepository: Repository<GoogleReviewSyncLog>,
    private readonly googleSyncService: GoogleSyncService,
  ) {}

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Validates the entity type against the allowlist and loads the entity with
   * its user relation (needed for IDOR check) and googleMapsUrl (needed for
   * the 422 URL gate). Throws BadRequestException on bad type, NotFoundException
   * if the entity is absent.
   */
  private async loadEntityWithUser(id: string, type: string): Promise<EntityWithUserAndUrl> {
    if (!(VALID_TYPES as readonly string[]).includes(type)) {
      throw new BadRequestException('Tipo de entidad no válido. Use: lodging, restaurant, commerce');
    }

    let entity: EntityWithUserAndUrl | null = null;

    if (type === 'lodging') {
      entity = await this.lodgingRepository.findOne({
        where: { id },
        relations: ['user'],
        select: { id: true, googleMapsUrl: true, lastSyncedMapsUrl: true, user: { id: true } },
      });
    } else if (type === 'restaurant') {
      entity = await this.restaurantRepository.findOne({
        where: { id },
        relations: ['user'],
        select: { id: true, googleMapsUrl: true, lastSyncedMapsUrl: true, user: { id: true } },
      });
    } else {
      entity = await this.commerceRepository.findOne({
        where: { id },
        relations: ['user'],
        select: { id: true, googleMapsUrl: true, lastSyncedMapsUrl: true, user: { id: true } },
      });
    }

    if (!entity) {
      throw new NotFoundException(`Entidad de tipo '${type}' con id '${id}' no encontrada`);
    }

    return entity;
  }

  /**
   * IDOR ownership guard with null-user null-guard.
   *
   * Uses optional chaining on entity.user?.id — when the user relation is null
   * (forcedPublic entity with no owner), `entity.user?.id` short-circuits to
   * `undefined`, which is !== currentUser.id, so isOwner becomes false.
   * This prevents a TypeError while correctly denying access to non-super users.
   */
  private assertOwner(entity: EntityWithUserAndUrl, user: User): void {
    const isOwner = entity.user?.id === user.id;
    if (!isOwner && !user.isSuperUser) {
      throw new ForbiddenException('No tienes permisos para sincronizar este negocio');
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Trigger a manual sync for a business entity the caller owns.
   *
   * Guards (in order):
   *   1. BadRequestException (400) — invalid :type
   *   2. NotFoundException (404) — entity not found
   *   3. ForbiddenException (403) — caller does not own entity (IDOR)
   *   4. UnprocessableEntityException (422) — entity has no valid Places URL
   *   5. HttpException 429 — triggered within the 1h cooldown window
   *   6. Returns immediately (202-queued) — syncEntity fires in background
   */
  async triggerSync(
    id: string,
    type: EntityType,
    currentUser: User,
  ): Promise<{ entityId: string; entityType: string; status: string; message: string }> {
    // 1. Load entity (validates type + existence)
    const entity = await this.loadEntityWithUser(id, type);

    // 2. IDOR ownership guard (entity.user?.id is the null-safe form)
    this.assertOwner(entity, currentUser);

    // 3. URL gate — 422 if the business has no valid Places URL
    if (!isPlacesGeneratedUrl(entity.googleMapsUrl)) {
      throw new UnprocessableEntityException(
        'Agrega la URL de tu negocio en Google Maps para poder sincronizar las reseñas.',
      );
    }

    // 4. Server-side 1h cooldown — based on sync-log startedAt (catches in-flight 'running' rows).
    //    Bypassed when the owner re-pointed the business to a different Google place
    //    (urlChanged): that corrective sync triggers a clean full resync and must not be
    //    blocked by the cooldown window, or the wrong place's reviews would linger up to 1h.
    const urlChanged =
      entity.lastSyncedMapsUrl != null && entity.lastSyncedMapsUrl !== entity.googleMapsUrl;
    if (!urlChanged) {
      const recent = await this.syncLogRepository.findOne({
        where: { entityId: id, entityType: type },
        order: { startedAt: 'DESC' },
      });
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (recent && recent.startedAt > oneHourAgo) {
        const remainingMinutes = Math.ceil((recent.startedAt.getTime() + 3_600_000 - Date.now()) / 60_000);
        throw new HttpException(
          {
            message: `Sincronización reciente. Intenta de nuevo en ${remainingMinutes} minuto(s).`,
            remainingMinutes,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 5. Fire-and-forget — do NOT await (Pitfall 6: attach .catch for observability)
    void this.googleSyncService.syncEntity(id, type, 'manual').catch((err: Error) =>
      this.logger.error(`Background sync failed for ${type}/${id}: ${err.message}`),
    );

    // 6. Return 202-queued immediately
    return {
      entityId: id,
      entityType: type,
      status: 'queued',
      message: 'Sincronización iniciada. Consulta el historial en ~90 segundos.',
    };
  }

  /**
   * Return a paginated list of sync-log entries for a given entity.
   * Owner-scoped: the caller must own the entity or be a super admin.
   */
  async getSyncHistory(
    id: string,
    type: EntityType,
    currentUser: User,
    page = 1,
    limit = 20,
  ): Promise<SyncHistoryResponseDto> {
    // Load entity for ownership check (validates type + existence too)
    const entity = await this.loadEntityWithUser(id, type);
    this.assertOwner(entity, currentUser);

    // Safe pagination bounds
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const [logs, count] = await this.syncLogRepository.findAndCount({
      where: { entityId: id, entityType: type },
      order: { startedAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    const data: SyncHistoryItemDto[] = logs.map(log => ({
      id: log.id,
      trigger: log.trigger,
      status: log.status,
      reviewsNew: log.reviewsNew,
      reviewsTotal: log.reviewsTotal,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      errorMessage: log.errorMessage,
    }));

    return {
      currentPage: safePage,
      pages: Math.ceil(count / safeLimit) || 1,
      count,
      data,
    };
  }
}
