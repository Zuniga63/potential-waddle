import { z } from 'zod';
import { RafaIntent, TRIP_STYLES } from './rafa-intent.enum';

// Schema para la salida de clasificación del LLM
export const ClassifyOutputSchema = z.object({
  intent: z.nativeEnum(RafaIntent),
  confidence: z.number().min(0).max(1),

  // Datos extraídos del mensaje del usuario
  extractedData: z.object({
    destination: z.string().nullable().optional(),
    partySize: z.number().int().min(1).nullable().optional(),
    dateFrom: z.string().nullable().optional(),
    dateTo: z.string().nullable().optional(),
    days: z.number().int().min(1).nullable().optional(),
    budgetMin: z.number().min(0).nullable().optional(),
    budgetMax: z.number().min(0).nullable().optional(),
    tripStyle: z.array(z.enum(TRIP_STYLES)).nullable().optional().transform(v => v ?? []),
    tags: z.array(z.string()).nullable().optional().transform(v => v ?? []),
    contactPhone: z.string().nullable().optional(),
    contactEmail: z.string().email().nullable().optional(),
    // Para SELECT_ENTITY
    selectedPosition: z.number().int().min(1).nullable().optional(),
    selectedName: z.string().nullable().optional(),
  }),

  // Razón de la clasificación (para debugging)
  reasoning: z.string().optional(),
});

export type ClassifyOutput = z.infer<typeof ClassifyOutputSchema>;

// Schema simplificado para Gemini (JSON mode)
export const CLASSIFY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: Object.values(RafaIntent),
      description: 'The detected intent from the user message',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Confidence score for the intent classification',
    },
    extractedData: {
      type: 'object',
      properties: {
        destination: { type: 'string', nullable: true },
        partySize: { type: 'integer', minimum: 1, nullable: true },
        dateFrom: { type: 'string', nullable: true, description: 'ISO date string' },
        dateTo: { type: 'string', nullable: true, description: 'ISO date string' },
        days: { type: 'integer', minimum: 1, nullable: true },
        budgetMin: { type: 'number', minimum: 0, nullable: true },
        budgetMax: { type: 'number', minimum: 0, nullable: true },
        tripStyle: {
          type: 'array',
          items: { type: 'string', enum: [...TRIP_STYLES] },
        },
        tags: { type: 'array', items: { type: 'string' } },
        contactPhone: { type: 'string', nullable: true },
        contactEmail: { type: 'string', nullable: true },
        selectedPosition: { type: 'integer', minimum: 1, nullable: true },
        selectedName: { type: 'string', nullable: true },
      },
    },
    reasoning: { type: 'string' },
  },
  required: ['intent', 'confidence', 'extractedData'],
};
