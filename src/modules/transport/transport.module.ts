import { Module } from '@nestjs/common';
import { TransportService } from './transport.service';
import { TransportController } from './transport.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transport } from './entities';
import { Category } from '../core/entities';
import { Town } from '../towns/entities';
import { User } from '../users/entities';
import { ReviewsModule } from '../reviews/reviews.module';
import { TermsModule } from '../terms/terms.module';

@Module({
  controllers: [TransportController],
  providers: [TransportService],
  imports: [
    TypeOrmModule.forFeature([Transport, Category, Town, User]),
    ReviewsModule,
    TermsModule,
  ],
})
export class TransportModule {}
