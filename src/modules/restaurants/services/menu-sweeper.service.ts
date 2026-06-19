import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Menu } from '../entities/menu.entity';

@Injectable()
export class MenuSweeperService {
  private readonly logger = new Logger(MenuSweeperService.name);

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sweepStuckMenus(): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = await this.menuRepository.update(
      { status: 'processing', createdAt: LessThan(tenMinutesAgo) },
      { status: 'failed' },
    );
    if (result.affected && result.affected > 0) {
      this.logger.warn(`Sweeper: marked ${result.affected} stuck menu(s) as failed`);
    }
  }
}
