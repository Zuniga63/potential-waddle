import { Module } from '@nestjs/common';
import { TinifyService } from './tinify.service';

@Module({
  providers: [TinifyService],
  exports: [TinifyService],
})
export class TinifyModule {}
