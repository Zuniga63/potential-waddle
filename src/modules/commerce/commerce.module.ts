import { Module } from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { CommerceController } from './commerce.controller';
import { Commerce } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommerceImage } from './entities';

@Module({
  controllers: [CommerceController],
  providers: [CommerceService],
  imports: [TypeOrmModule.forFeature([Commerce, CommerceImage])],
})
export class CommerceModule {}
