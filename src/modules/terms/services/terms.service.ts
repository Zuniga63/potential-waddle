import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';

import { User } from 'src/modules/users/entities';

import { TermsDocument, TermsAcceptance } from '../entities';
import { TermsTypeEnum, TermsContextEnum } from '../interfaces';
import { TermsDocumentDto, TermsStatusDto, TermsActiveIdsDto } from '../dto';

interface AcceptInput {
  termsId: string;
  user: User;
  context: TermsContextEnum;
  ip: string;
  userAgent: string | undefined;
}

@Injectable()
export class TermsService {
  constructor(
    @InjectRepository(TermsDocument)
    private readonly docsRepo: Repository<TermsDocument>,
    @InjectRepository(TermsAcceptance)
    private readonly acceptsRepo: Repository<TermsAcceptance>,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ACTIVE TERMS DOCUMENT FOR A TYPE
  // * ----------------------------------------------------------------------------------------------------------------
  async findActive(type: TermsTypeEnum): Promise<TermsDocumentDto> {
    const doc = await this.docsRepo.findOne({ where: { type, isActive: true } });
    if (!doc) throw new NotFoundException(`No active terms document for type '${type}'`);
    return new TermsDocumentDto(doc);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * RECORD ACCEPTANCE (IDEMPOTENT)
  // * ----------------------------------------------------------------------------------------------------------------
  async accept({ termsId, user, context, ip, userAgent }: AcceptInput): Promise<{ id: string; acceptedAt: string }> {
    const doc = await this.docsRepo.findOne({ where: { id: termsId } });
    if (!doc) throw new NotFoundException(`Terms document ${termsId} not found`);
    if (!doc.isActive) throw new BadRequestException('TERMS_NOT_ACTIVE');

    // Idempotent short-circuit: if an acceptance already exists, return it
    const existing = await this.acceptsRepo.findOne({
      where: { userId: user.id, termsDocumentId: termsId },
    });
    if (existing) {
      return { id: existing.id, acceptedAt: existing.acceptedAt.toISOString() };
    }

    try {
      const row = this.acceptsRepo.create({
        userId: user.id,
        termsDocumentId: termsId,
        context,
        ipAddress: ip,
        userAgent: userAgent ?? null,
      });
      const saved = await this.acceptsRepo.save(row);
      return { id: saved.id, acceptedAt: saved.acceptedAt.toISOString() };
    } catch (err) {
      // Handle race: unique violation on (user_id, terms_document_id) → re-read existing row
      if (err instanceof QueryFailedError && (err as unknown as { code?: string }).code === '23505') {
        const existingAfterRace = await this.acceptsRepo.findOne({
          where: { userId: user.id, termsDocumentId: termsId },
        });
        if (existingAfterRace) {
          return { id: existingAfterRace.id, acceptedAt: existingAfterRace.acceptedAt.toISOString() };
        }
      }
      throw err;
    }
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET STATUS FOR A USER (6 BOOLEANS + ACTIVE IDS)
  // * ----------------------------------------------------------------------------------------------------------------
  async getStatusForUser(userId: string): Promise<TermsStatusDto> {
    const actives = await this.docsRepo.find({ where: { isActive: true } });

    const activeIds: TermsActiveIdsDto = {
      user: null,
      lodging: null,
      restaurant: null,
      commerce: null,
      transport: null,
      guide: null,
    };
    for (const doc of actives) {
      activeIds[doc.type] = doc.id;
    }

    const nonNullIds = (Object.values(activeIds) as (string | null)[]).filter(
      (v): v is string => v !== null,
    );
    const accepted = nonNullIds.length
      ? await this.acceptsRepo.find({
          where: { userId, termsDocumentId: In(nonNullIds) },
        })
      : [];
    const acceptedSet = new Set(accepted.map(a => a.termsDocumentId));

    const has = (t: TermsTypeEnum): boolean => {
      const id = activeIds[t];
      return id !== null && acceptedSet.has(id);
    };

    const dto = new TermsStatusDto();
    dto.hasAcceptedUserTerms = has(TermsTypeEnum.User);
    dto.hasAcceptedLodgingTerms = has(TermsTypeEnum.Lodging);
    dto.hasAcceptedRestaurantTerms = has(TermsTypeEnum.Restaurant);
    dto.hasAcceptedCommerceTerms = has(TermsTypeEnum.Commerce);
    dto.hasAcceptedTransportTerms = has(TermsTypeEnum.Transport);
    dto.hasAcceptedGuideTerms = has(TermsTypeEnum.Guide);
    dto.activeDocumentIds = activeIds;
    return dto;
  }
}
