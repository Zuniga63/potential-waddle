import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { RafaController } from './rafa.controller';
import { RafaService, LlmService, ToolsService } from './services';
import { RafaConversation, RafaMessage, RafaLead } from './entities';

// Experts
import {
  SearchExpert,
  ConversationExpert,
  BudgetExpert,
  ItineraryExpert,
  LeadExpert,
} from './experts';

// Entities for search
import { Lodging } from '../lodgings/entities';
import { Restaurant } from '../restaurants/entities';
import { Experience } from '../experiences/entities';
import { Place } from '../places/entities';
import { Guide } from '../guides/entities/guide.entity';
import { Transport } from '../transport/entities/transport.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Town } from '../towns/entities';

// Pinecone module for RAG search
import { PineconeModule } from '../pinecone/pinecone.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      // Rafa entities
      RafaConversation,
      RafaMessage,
      RafaLead,
      // Search entities
      Lodging,
      Restaurant,
      Experience,
      Place,
      Guide,
      Transport,
      Commerce,
      Town,
    ]),
    PineconeModule,
  ],
  controllers: [RafaController],
  providers: [
    // Core services
    RafaService,
    LlmService,
    ToolsService,
    // Experts
    SearchExpert,
    ConversationExpert,
    BudgetExpert,
    ItineraryExpert,
    LeadExpert,
  ],
  exports: [RafaService],
})
export class RafaModule {}
