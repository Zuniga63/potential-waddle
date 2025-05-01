import { Injectable } from '@nestjs/common';
import { GoogleReviewInterface } from '../google-places/interfaces/google-review.interface';
import { Pinecone, PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { appConfig } from 'src/config/app-config';
import { createReviewDocument } from './lib/embeddings';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from '@langchain/openai';
import { InjectRepository } from '@nestjs/typeorm';
import { GoogleReview } from '../google-places/entities';
import { Repository } from 'typeorm';

@Injectable()
export class PineconeService {
  private readonly pineconeClient: Pinecone;
  private embeddings: OpenAIEmbeddings;
  constructor(
    @InjectRepository(GoogleReview)
    private googleReviewRepository: Repository<GoogleReview>,
  ) {
    const apiKey = appConfig().pinecone.apiKey;
    const environment = appConfig().pinecone.environment;
    const indexName = appConfig().pinecone.pineconeIndexGoogleReview;

    // Crear instancia de OpenAI Embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: appConfig().openai.apiKey,
      modelName: 'text-embedding-3-small', // Modelo de embeddings moderno y eficiente
    });

    if (!apiKey || !environment || !indexName) {
      throw new Error('Faltan variables de entorno necesarias para Pinecone');
    }

    this.pineconeClient = new Pinecone({
      apiKey,
    });
  }

  // ------------------------------------------------------------------------------------------------
  // Create Review Vector
  // ------------------------------------------------------------------------------------------------
  async createReviewVector(reviews: GoogleReviewInterface[]) {
    const index = await this.getPineconeIndex();
    const documents: Document[] = [];

    reviews.forEach(async (review: GoogleReviewInterface) => {
      documents.push(createReviewDocument(review));
    });

    const texts = documents.map((doc: Document) => doc.pageContent);
    const embeddingArrays = await this.embeddings.embedDocuments(texts);

    const vectors = documents.map((doc, i) => {
      const vectorId = `${doc.metadata.id}-${Date.now()}-${i}`;

      // Actualizar el pineconeId en la base de datos
      this.googleReviewRepository.update({ reviewId: doc.metadata.id }, { pineconeId: vectorId });

      return {
        id: vectorId,
        values: embeddingArrays[i],
        metadata: {
          text: doc.pageContent,
          ...doc.metadata,
        },
      };
    });

    await index.upsert(vectors as PineconeRecord<RecordMetadata>[]);
  }

  // ------------------------------------------------------------------------------------------------
  // Get Pinecone Index
  // ------------------------------------------------------------------------------------------------
  async getPineconeIndex() {
    return this.pineconeClient.index(appConfig().pinecone.pineconeIndexGoogleReview);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete All Vectors By Entity Id
  // ------------------------------------------------------------------------------------------------
  async deleteAllVectorsByEntityId(entityId: string, entityType: string) {
    const reviews = await this.googleReviewRepository.find({
      where: {
        entityId: entityId,
        entityType: entityType as 'Lodging' | 'Restaurant',
      },
    });

    const pineconeIds = reviews.map(review => review.pineconeId);
    const index = await this.getPineconeIndex();
    const results = await index.listPaginated({ prefix: entityId });
    console.log(`✅ Results: ${results}`);

    // Implementación del borrado por lotes
    const batchSize = 100;
    for (let i = 0; i < pineconeIds.length; i += batchSize) {
      const batch = pineconeIds.slice(i, i + batchSize);
      await index.deleteMany(batch);
    }
  }
}
