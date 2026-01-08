import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Town } from '../towns/entities/town.entity';

@Injectable()
export class TenantService {
  private townCache: Map<string, Town> = new Map();

  constructor(
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
  ) {}

  async getTownBySlug(slug: string): Promise<Town | null> {
    // Check cache first
    if (this.townCache.has(slug)) {
      return this.townCache.get(slug) || null;
    }

    const town = await this.townRepository.findOne({
      where: { slug, isEnable: true },
    });

    if (town) {
      this.townCache.set(slug, town);
    }

    return town;
  }

  async getTownById(id: string): Promise<Town | null> {
    return this.townRepository.findOne({ where: { id } });
  }

  extractSlugFromOrigin(origin: string | undefined): string | null {
    if (!origin) return null;

    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      // Extract subdomain: sanrafael.binntu.com -> sanrafael
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const subdomain = parts[0];
        // Ignore common subdomains
        if (['www', 'api', 'admin'].includes(subdomain)) {
          return null;
        }
        return subdomain;
      }
    } catch {
      return null;
    }

    return null;
  }

  clearCache() {
    this.townCache.clear();
  }
}
