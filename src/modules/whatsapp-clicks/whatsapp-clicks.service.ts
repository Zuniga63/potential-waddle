import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { WhatsappClick } from './entities';
import { CreateWhatsappClickDto } from './dto';
import { User } from '../users/entities';
import { WhatsappClicksReadAdapter } from './whatsapp-clicks-read.adapter';

// Simple user-agent parser (lightweight alternative to ua-parser-js)
interface ParsedUserAgent {
  browser: { name: string | null; version: string | null };
  os: { name: string | null; version: string | null };
  device: { type: string | null };
}

/**
 * MIG-01: the three READ methods (getDetailedAnalytics, getAggregatedAnalytics,
 * getDashboardStats) now delegate to WhatsappClicksReadAdapter, which serves data from
 * the generic `events` table (Phase 15) — byte-identical shapes, zero frontend change.
 * The `whatsapp_click` table is retained READ-ONLY (the client stopped writing to it in
 * Phase 16) pending the user's prod cutover and is NOT dropped in this phase. The
 * `create()` write + `getAnalytics()` methods are intentionally left untouched.
 */
@Injectable()
export class WhatsappClicksService {
  private readonly logger = new Logger(WhatsappClicksService.name);

  constructor(
    @InjectRepository(WhatsappClick)
    private readonly whatsappClickRepository: Repository<WhatsappClick>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly readAdapter: WhatsappClicksReadAdapter,
  ) {}

  /**
   * Create a new WhatsApp click record
   */
  async create(createDto: CreateWhatsappClickDto, ipAddress?: string): Promise<WhatsappClick> {
    try {
      // Parse user agent
      const uaData = this.parseUserAgent(createDto.userAgent || '');

      // Check if it's a repeat click
      const isRepeat = await this.checkRepeatClick(createDto.sessionId, createDto.entityId);

      // Get user if authenticated
      let user: User | null = null;
      if (createDto.userId) {
        user = await this.userRepository.findOne({
          where: { id: createDto.userId },
        });
      }

      // Create click record
      const whatsappClick = this.whatsappClickRepository.create({
        entityId: createDto.entityId,
        entityType: createDto.entityType,
        entitySlug: createDto.entitySlug || null,
        phoneNumber: createDto.phoneNumber,
        user: user,
        sessionId: createDto.sessionId || null,
        ipAddress: this.anonymizeIp(ipAddress) || null,
        userAgent: createDto.userAgent || null,
        browserName: uaData.browser.name,
        browserVersion: uaData.browser.version,
        osName: uaData.os.name,
        osVersion: uaData.os.version,
        deviceType: uaData.device.type,
        latitude: createDto.latitude || null,
        longitude: createDto.longitude || null,
        country: createDto.country || null,
        city: createDto.city || null,
        referrer: createDto.referrer || null,
        timeOnPage: createDto.timeOnPage || null,
        isRepeatClick: isRepeat,
        pageType: createDto.pageType || null,
      });

      return await this.whatsappClickRepository.save(whatsappClick);
    } catch (error) {
      this.logger.error('Error creating WhatsApp click', error);
      throw error;
    }
  }

  /**
   * Check if this is a repeat click (same session, same entity, within 30 minutes)
   */
  private async checkRepeatClick(sessionId: string | undefined, entityId: string): Promise<boolean> {
    if (!sessionId) return false;

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const previousClick = await this.whatsappClickRepository.findOne({
      where: {
        sessionId,
        entityId,
        clickedAt: LessThan(new Date()),
      },
      order: { clickedAt: 'DESC' },
    });

    return !!previousClick && previousClick.clickedAt > thirtyMinutesAgo;
  }

  /**
   * Anonymize IP address for GDPR compliance
   */
  private anonymizeIp(ip: string | undefined): string | null {
    if (!ip) return null;

    // IPv4: Remove last octet
    if (ip.includes('.')) {
      const parts = ip.split('.');
      parts[3] = '0';
      return parts.join('.');
    }

    // IPv6: Remove last 80 bits
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::';
    }

    return ip;
  }

  /**
   * Simple user agent parser
   */
  private parseUserAgent(userAgent: string): ParsedUserAgent {
    const ua = userAgent.toLowerCase();

    // Browser detection
    let browserName: string | null = null;
    let browserVersion: string | null = null;

    if (ua.includes('edg/')) {
      browserName = 'Edge';
      browserVersion = this.extractVersion(ua, 'edg/');
    } else if (ua.includes('chrome/')) {
      browserName = 'Chrome';
      browserVersion = this.extractVersion(ua, 'chrome/');
    } else if (ua.includes('firefox/')) {
      browserName = 'Firefox';
      browserVersion = this.extractVersion(ua, 'firefox/');
    } else if (ua.includes('safari/') && !ua.includes('chrome')) {
      browserName = 'Safari';
      browserVersion = this.extractVersion(ua, 'version/');
    } else if (ua.includes('opera/') || ua.includes('opr/')) {
      browserName = 'Opera';
      browserVersion = this.extractVersion(ua, ua.includes('opr/') ? 'opr/' : 'opera/');
    }

    // OS detection
    let osName: string | null = null;
    let osVersion: string | null = null;

    if (ua.includes('windows')) {
      osName = 'Windows';
      if (ua.includes('windows nt 10')) osVersion = '10';
      else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
      else if (ua.includes('windows nt 6.2')) osVersion = '8';
      else if (ua.includes('windows nt 6.1')) osVersion = '7';
    } else if (ua.includes('mac os x')) {
      osName = 'macOS';
      const match = ua.match(/mac os x ([\d_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (ua.includes('android')) {
      osName = 'Android';
      const match = ua.match(/android ([\d.]+)/);
      if (match) osVersion = match[1];
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      osName = 'iOS';
      const match = ua.match(/os ([\d_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (ua.includes('linux')) {
      osName = 'Linux';
    }

    // Device type detection
    let deviceType: string | null = 'desktop';
    if (ua.includes('mobile')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    }

    return {
      browser: { name: browserName, version: browserVersion },
      os: { name: osName, version: osVersion },
      device: { type: deviceType },
    };
  }

  /**
   * Extract version from user agent string
   */
  private extractVersion(ua: string, identifier: string): string | null {
    const regex = new RegExp(`${identifier}([\\d.]+)`);
    const match = ua.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Get analytics data
   */
  async getAnalytics(entityId?: string, entityType?: string) {
    const query = this.whatsappClickRepository.createQueryBuilder('click');

    if (entityId) {
      query.andWhere('click.entityId = :entityId', { entityId });
    }

    if (entityType) {
      query.andWhere('click.entityType = :entityType', { entityType });
    }

    const [clicks, total] = await query.getManyAndCount();

    // Basic analytics
    const repeatClicks = clicks.filter(c => c.isRepeatClick).length;
    const uniqueSessions = new Set(clicks.map(c => c.sessionId).filter(Boolean)).size;
    const deviceTypes = clicks.reduce(
      (acc, click) => {
        const type = click.deviceType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      uniqueSessions,
      repeatClicks,
      repeatRate: total > 0 ? (repeatClicks / total) * 100 : 0,
      deviceTypes,
      clicks,
    };
  }

  /**
   * Get aggregated analytics for admin panel (all entities).
   * MIG-01: delegates to the events-backed read adapter (byte-identical shape).
   */
  async getAggregatedAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    entityType?: string;
    page: number;
    limit: number;
  }) {
    return this.readAdapter.getAggregatedAnalytics(filters);
  }

  /**
   * Get detailed analytics for entity dashboard.
   * MIG-01: delegates to the events-backed read adapter (byte-identical shape).
   */
  async getDetailedAnalytics(entityId: string, entityType: string) {
    return this.readAdapter.getDetailedAnalytics(entityId, entityType);
  }

  /**
   * Get dashboard stats - clicks by day grouped by entity type.
   * MIG-01: delegates to the events-backed read adapter (byte-identical shape).
   */
  async getDashboardStats(days: number = 7, townId?: string) {
    return this.readAdapter.getDashboardStats(days, townId);
  }
}
