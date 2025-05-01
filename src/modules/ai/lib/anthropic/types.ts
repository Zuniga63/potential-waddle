/**
 * Interfaces y tipos para la aplicación
 */

// Para el formato de embebido

// Para el formato de embebido
export interface DocumentWithMetadata {
  pageContent: string;
  metadata: {
    id: string;
    entityId: string;
    entityType: 'lodging' | 'restaurant';
    rating: number;
    text: string;
    source: string;
  };
}

// Tipos para los mensajes de chat
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Tipo para la respuesta de la API
export interface ChatResponse {
  response: string;
}

// Para manejar errores
export interface ErrorResponse {
  error: string;
  details?: string;
}

// Resultado de indexación
export interface IndexResult {
  success: boolean;
  count: number;
  message?: string;
}
