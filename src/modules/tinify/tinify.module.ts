import { Module } from '@nestjs/common';
import { TinifyService } from './tinify.service';
import { TinifyController } from './tinify.controller';

@Module({
  providers: [TinifyService],
  exports: [TinifyService],
  controllers: [TinifyController],
})
export class TinifyModule {}
