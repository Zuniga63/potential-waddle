import { Module } from '@nestjs/common';
import { DistributedLockService } from './services/distributed-lock.service';

@Module({
  controllers: [],
  providers: [DistributedLockService],
  exports: [DistributedLockService],
})
export class CommonModule {}
