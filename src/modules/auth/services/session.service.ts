import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthLoginParams } from '../types';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession({ user, ip, userAgent }: AuthLoginParams) {
    const now = new Date(Date.now());

    const existingSession = await this.sessionRepository.findOne({
      where: { user: { id: user.id }, ipAddress: ip, userAgent: userAgent },
    });

    if (existingSession) {
      existingSession.lastActivity = now;
      return this.sessionRepository.save(existingSession);
    }

    const newSession = this.sessionRepository.create({ user, ipAddress: ip, userAgent, lastActivity: now });
    return this.sessionRepository.save(newSession);
  }

  async updateLastActivity(id: string) {
    return this.sessionRepository.update(id, { lastActivity: new Date(Date.now()) });
  }

  async findAllByUserId(userId: string) {
    return this.sessionRepository.find({ where: { user: { id: userId } }, order: { lastActivity: 'DESC' } });
  }

  async deleteSession(id: string) {
    return this.sessionRepository.delete(id);
  }
}
