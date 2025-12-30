import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PineconeService } from './pinecone.service';
import { ChunkingService } from './chunking.service';
import { VectorizationService } from './vectorization.service';
import { VectorizationController } from './vectorization.controller';

import { GoogleReview } from '../google-places/entities';
import { Lodging } from '../lodgings/entities';
import { Restaurant } from '../restaurants/entities';
import { Experience } from '../experiences/entities';
import { Place } from '../places/entities';
import { Guide } from '../guides/entities/guide.entity';
import { Transport } from '../transport/entities/transport.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Town } from '../towns/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoogleReview, Lodging, Restaurant, Experience, Place, Guide, Transport, Commerce, Town]),
  ],
  controllers: [VectorizationController],
  exports: [PineconeService, ChunkingService, VectorizationService],
  providers: [PineconeService, ChunkingService, VectorizationService],
})
export class PineconeModule {}
