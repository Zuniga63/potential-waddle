import { Module } from '@nestjs/common';
import { PineconeService } from './pinecone.service';
import { GoogleReview } from '../google-places/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([GoogleReview])],
  exports: [PineconeService],
  providers: [PineconeService],
})
export class PineconeModule {}
