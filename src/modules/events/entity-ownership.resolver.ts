// BIZ-08 / T-17-01/02/05: the IDOR gate for the per-entity analytics read.
//
// `assertCanRead` MUST run BEFORE any analytics query (wired in EventsController). It resolves
// the entity's owner + town and authorizes the caller as one of:
//   - super-admin (user.isSuperUser)
//   - the entity owner (entity.user_id === user.id)
//   - a town-admin whose user.towns includes the entity's town_id
// Anyone else gets a ForbiddenException (403). A missing entity gets NotFoundException (404).
//
// Security (T-17-05): entityId/town values are ALWAYS passed as bound parameters ($1). The
// table name is selected from a fixed whitelist keyed by entityType — user input never reaches
// the SQL string. An unknown entityType maps to nothing => treated as not-found.
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../users/entities';

interface OwnerRow {
  user_id: string | null;
  town_id: string | null;
}

/**
 * Fixed, whitelisted owner-resolution SQL per entity type. Each returns at most one row with
 * `user_id` (owner, NULL where the entity has no owner column) and `town_id` (NULL for guide —
 * guide town lives in the guide_town join table, resolved separately). entityId is bound as $1.
 */
const OWNER_QUERY: Record<string, string> = {
  lodging: 'SELECT user_id, town_id FROM "lodging" WHERE id = $1',
  restaurant: 'SELECT user_id, town_id FROM "restaurant" WHERE id = $1',
  commerce: 'SELECT user_id, town_id FROM "commerce" WHERE id = $1',
  transport: 'SELECT user_id, town_id FROM "transport" WHERE id = $1',
  // guide has no town_id column — town(s) come from guide_town (see resolveGuideTowns)
  guide: 'SELECT user_id, NULL::uuid AS town_id FROM "guide" WHERE id = $1',
  // experience has no owner column — owner is the guide's user; town is on experience
  experience:
    'SELECT g.user_id AS user_id, e.town_id AS town_id FROM "experience" e LEFT JOIN "guide" g ON g.id = e.guide_id WHERE e.id = $1',
  // place is admin-managed: no owner column, town-scoped only
  place: 'SELECT NULL::uuid AS user_id, town_id FROM "place" WHERE id = $1',
};

@Injectable()
export class EntityOwnershipResolver {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Authorize `user` to read analytics for (entityType, entityId).
   * @returns the resolved `{ townId }` (the entity's town, for downstream tenant context).
   * @throws NotFoundException if the entity (or entityType) does not exist.
   * @throws ForbiddenException if the user is neither owner, town-admin of its town, nor super.
   */
  async assertCanRead(entityType: string, entityId: string, user: User): Promise<{ townId: string | null }> {
    const sql = OWNER_QUERY[entityType];
    if (!sql) throw new NotFoundException('Entidad no encontrada');

    const rows: OwnerRow[] = await this.dataSource.query(sql, [entityId]);
    const row = rows?.[0];
    if (!row) throw new NotFoundException('Entidad no encontrada');

    // Guide stores its towns in guide_town (a guide can belong to several towns).
    const townIds: (string | null)[] =
      entityType === 'guide' ? await this.resolveGuideTowns(entityId) : [row.town_id];

    // Super-admin sees everything.
    if (user?.isSuperUser) {
      return { townId: townIds[0] ?? null };
    }

    const isOwner = !!row.user_id && row.user_id === user?.id;

    const userTownIds = new Set((user?.towns ?? []).map((t) => t.id));
    const isTownAdmin = townIds.some((tid) => !!tid && userTownIds.has(tid));

    if (isOwner || isTownAdmin) {
      // Prefer the town the caller administers (so downstream tenant context matches), else first.
      const matchedTown = townIds.find((tid) => !!tid && userTownIds.has(tid));
      return { townId: matchedTown ?? townIds[0] ?? null };
    }

    throw new ForbiddenException('No tienes acceso a las analíticas de este negocio');
  }

  /** Resolve the set of town_ids a guide belongs to (guide_town join table). */
  private async resolveGuideTowns(guideId: string): Promise<(string | null)[]> {
    const rows: { town_id: string }[] = await this.dataSource.query(
      'SELECT town_id FROM "guide_town" WHERE guide_id = $1',
      [guideId],
    );
    return rows.map((r) => r.town_id);
  }
}
