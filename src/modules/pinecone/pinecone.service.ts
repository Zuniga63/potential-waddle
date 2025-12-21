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
import { DocumentWithMetadata } from '../ai/lib/anthropic/types';

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
          id: doc.metadata.id || '',
          entityId: doc.metadata.entityId || '',
          entityType: doc.metadata.entityType || '',
          rating: doc.metadata.rating || 0,
          text: doc.pageContent,
          source: doc.metadata.source || '',
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
  async deleteAllVectorsByEntityId(entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    console.log('🔄 Iniciando proceso de eliminación de vectores...');

    // Obtener las reseñas
    const reviews = await this.googleReviewRepository.find({
      where: {
        entityId: entityId,
        entityType: entityType,
      },
    });

    console.log(`📊 Encontradas ${reviews.length} reseñas para eliminar`);

    if (reviews.length === 0) {
      console.log('⚠️ No se encontraron reseñas para eliminar');
      return;
    }

    // Filtrar solo los pineconeIds que no sean null
    const pineconeIds = reviews.filter(review => review.pineconeId).map(review => review.pineconeId);

    console.log(`🎯 PineconeIDs a eliminar: ${pineconeIds.length}`);

    if (pineconeIds.length > 0) {
      const index = await this.getPineconeIndex();

      // Implementación del borrado por lotes
      const batchSize = 1000;
      for (let i = 0; i < pineconeIds.length; i += batchSize) {
        const batch = pineconeIds.slice(i, i + batchSize);
        try {
          await index.deleteMany(batch);
          console.log(`✅ Eliminado lote ${i / batchSize + 1}`);
        } catch (error) {
          console.error(`❌ Error al eliminar lote: ${error.message}`);
        }
      }
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Search Documents
  // ------------------------------------------------------------------------------------------------
  async searchDocuments(query: string, entityId: string, entityType: 'lodging' | 'restaurant' | 'commerce') {
    try {
      const index = await this.getPineconeIndex();

      // Generar embedding para la consulta
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Buscar vectores similares en Pinecone con filtro por entityId
      const searchResults = await index.query({
        vector: queryEmbedding,
        topK: 10,
        includeMetadata: true,
        filter: {
          entityId: { $eq: entityId },
          entityType: { $eq: entityType },
        },
      });

      console.log(searchResults, 'searchResults');

      // Convertir resultados a formato DocumentWithMetadata
      const documents = searchResults.matches.map(match => {
        const metadata = match.metadata as DocumentWithMetadata['metadata'];
        return {
          pageContent: metadata.text || '',
          metadata: {
            id: metadata.id || '',
            entityId: metadata.entityId || '',
            entityType: metadata.entityType || '',
            rating: metadata.rating || 0,
            text: metadata.text || '',
            source: metadata.source || '',
          },
        };
      });

      return documents;
    } catch (error) {
      console.error('Error al buscar documentos:', error);
      return [];
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Format Search Results
  // ------------------------------------------------------------------------------------------------
  /**
   * Formatea los resultados de búsqueda de Pinecone para enviarlos a Claude
   * @param documents - Documentos obtenidos de Pinecone
   * @returns Texto formateado con la información relevante
   */
  formatSearchResults(documents: DocumentWithMetadata[]): string {
    if (!documents || documents.length === 0) {
      return 'No se encontraron resultados.';
    }

    return documents
      .map(doc => {
        return `---\n${doc.pageContent}\n`;
      })
      .join('\n');
  }
}
