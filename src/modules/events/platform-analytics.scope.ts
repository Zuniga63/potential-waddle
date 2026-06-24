// PLAT-04 / T-18-01/02: the IDOR gate for the platform analytics read.
//
// `resolvePlatformScope` is a PURE function (unit-testable, no DB) that decides which towns a
// caller may see. It MUST run BEFORE any analytics query (wired in EventsController, mirroring
// the entity resolver's assertCanRead gate ordering).
//
// Rules:
//   - super-admin (user.isSuperUser === true):
//       * a `requestedTown` (slug OR id) -> { townIds: [requestedTown] } (the service resolves
//         slug -> id; this pure function keeps the raw value and never touches the DB).
//       * no `requestedTown` -> { townIds: null } = ALL towns (no town predicate at the SQL layer).
//   - town-admin (not super): the `requestedTown` is IGNORED ENTIRELY and scope is FORCED to the
//       user's own towns -> { townIds: user.towns.map(t => t.id) }. A town-admin can NEVER widen
//       scope; the requested (other) town's id never appears in the returned townIds (IDOR closed).
//   - a user with NO towns and not super -> ForbiddenException (no platform access).
//
// Slug -> id resolution is intentionally OUT of this function so it stays a pure, DB-free unit.
import { ForbiddenException } from '@nestjs/common';

export interface PlatformScopeUser {
  isSuperUser?: boolean;
  towns?: { id: string; slug?: string }[];
}

export interface PlatformScope {
  // null = ALL towns (super-admin, no filter). A non-null array scopes the query to those town ids
  // (or, for a super-admin's single requested slug/id, the raw requestedTown the service resolves).
  townIds: string[] | null;
  // true ONLY when a super-admin passed a single `town` value that may be a slug needing slug->id
  // resolution. For forced town-admin scopes this is false (their towns are already concrete ids),
  // so the service never misinterprets a forced town id as a slug.
  resolveSlug: boolean;
}

export function resolvePlatformScope(user: PlatformScopeUser, requestedTown?: string): PlatformScope {
  // Super-admin: may see everything, or filter by a single requested town (slug or id).
  if (user?.isSuperUser === true) {
    if (requestedTown) {
      // Keep the raw value; the service resolves slug -> id before querying. Bound param only.
      return { townIds: [requestedTown], resolveSlug: true };
    }
    return { townIds: null, resolveSlug: false }; // ALL towns — no town predicate.
  }

  // Town-admin: FORCE their own towns; IGNORE requestedTown entirely (never read it — IDOR gate).
  const ownTownIds = (user?.towns ?? []).map((t) => t.id).filter((id): id is string => !!id);

  if (ownTownIds.length === 0) {
    // Not super and no towns -> no platform access.
    throw new ForbiddenException('No tienes acceso a las analíticas de plataforma');
  }

  return { townIds: ownTownIds, resolveSlug: false };
}
