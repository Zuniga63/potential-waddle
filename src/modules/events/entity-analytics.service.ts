// Placeholder — full implementation lands in Task 2.
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EntityAnalyticsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getEntityAnalytics(_params: {
    entityType: string;
    entityId: string;
    from?: string;
    to?: string;
    townId: string | null;
  }): Promise<any> {
    void this.dataSource;
    throw new Error('not implemented');
  }
}
