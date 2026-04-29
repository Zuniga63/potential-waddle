import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { TermsAcceptance } from '../entities';
import { TermsContextEnum } from '../interfaces';

export class AdminAcceptancesFiltersDto {
  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 50, required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}

export class AdminAcceptanceUserDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ example: 'jhondoe' })
  name: string;

  @ApiProperty({ example: 'jhondoe@example.com' })
  email: string;

  @ApiProperty({ example: 'jhondoe', required: false })
  username?: string;

  constructor(data: { id: string; name: string; email: string; username?: string }) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.username = data.username;
  }
}

export class AdminTermsAcceptanceDto {
  @ApiProperty({ example: '624013aa-9555-4a69-bf08-30cf990c56dd' })
  id: string;

  @ApiProperty({ type: AdminAcceptanceUserDto })
  user: AdminAcceptanceUserDto;

  @ApiProperty({ example: '2026-04-24T00:00:00.000Z' })
  acceptedAt: string;

  @ApiProperty({ example: '192.168.1.1' })
  ipAddress: string;

  @ApiProperty({ example: 'Mozilla/5.0 ...', nullable: true })
  userAgent: string | null;

  @ApiProperty({ enum: TermsContextEnum })
  context: TermsContextEnum;

  constructor(acc: TermsAcceptance) {
    this.id = acc.id;
    this.user = acc.user
      ? new AdminAcceptanceUserDto({
          id: acc.user.id,
          name: acc.user.username,
          email: acc.user.email,
          username: acc.user.username,
        })
      : new AdminAcceptanceUserDto({ id: acc.userId, name: 'Unknown', email: '' });
    this.acceptedAt = acc.acceptedAt.toISOString();
    this.ipAddress = acc.ipAddress;
    this.userAgent = acc.userAgent;
    this.context = acc.context;
  }
}

export class AdminAcceptancesPageMetaDto {
  @ApiProperty({ example: 1234 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  pageSize: number;
}

export class AdminAcceptancesListDto {
  @ApiProperty({ type: [AdminTermsAcceptanceDto] })
  data: AdminTermsAcceptanceDto[];

  @ApiProperty({ type: AdminAcceptancesPageMetaDto })
  meta: AdminAcceptancesPageMetaDto;

  constructor(rows: TermsAcceptance[], meta: AdminAcceptancesPageMetaDto) {
    this.data = rows.map(r => new AdminTermsAcceptanceDto(r));
    this.meta = meta;
  }
}
