// PLAT-01..04: query contract for GET /api/events/analytics/platform.
//
// Unlike the per-entity DTO, ALL fields are optional. `town` is a town slug OR id and is
// UNTRUSTED user input — it is only ever honored for a super-admin (see resolvePlatformScope,
// the IDOR gate, T-18-01). A town-admin's `town` param is ignored server-side; their scope is
// FORCED to their own towns. The value never reaches SQL except as a bound param.
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Window start (ISO date). Defaults to 30 days before `to`.',
    example: '2026-05-24',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Window end (ISO date). Defaults to now.',
    example: '2026-06-23',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Town slug OR id to filter by. Honored ONLY for super-admins; town-admins are forced to ' +
      'their own town and this value is ignored server-side (IDOR gate).',
    example: 'sanrafael',
  })
  @IsOptional()
  @IsString()
  town?: string;
}
