import { Schema, SchemaType } from '@google/generative-ai';

/**
 * Gemini responseSchema for structured review analysis.
 *
 * Mirrors StructuredReviewAnalysis (frontend Plan 24-01 contract) field-for-field
 * across all 8 sections of reviewAnalysisPrompt.
 *
 * Used with responseMimeType: 'application/json' to force Gemini to emit
 * conformant JSON instead of markdown prose.
 */
export const structuredReviewAnalysisSchema: Schema = {
  type: SchemaType.OBJECT,
  required: [
    'executiveSummary',
    'strengths',
    'weaknesses',
    'themes',
    'temporalAnalysis',
    'customerProfile',
    'recommendations',
    'conclusion',
  ],
  properties: {
    executiveSummary: {
      type: SchemaType.OBJECT,
      required: ['totalReviews', 'averageRating', 'period', 'generalTrend', 'dominantSentiment'],
      properties: {
        totalReviews: { type: SchemaType.NUMBER },
        averageRating: { type: SchemaType.NUMBER },
        period: { type: SchemaType.STRING },
        generalTrend: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['Muy Positiva', 'Positiva', 'Neutral', 'Negativa', 'Muy Negativa'],
        },
        dominantSentiment: { type: SchemaType.STRING },
      },
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ['aspect', 'mentionCount', 'mentionPercentage', 'representativeQuote'],
        properties: {
          aspect: { type: SchemaType.STRING },
          mentionCount: { type: SchemaType.NUMBER },
          mentionPercentage: { type: SchemaType.NUMBER },
          representativeQuote: { type: SchemaType.STRING },
        },
      },
    },
    weaknesses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ['issue', 'frequency', 'impact', 'exampleQuote', 'suggestion'],
        properties: {
          issue: { type: SchemaType.STRING },
          frequency: { type: SchemaType.NUMBER },
          impact: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['Alto', 'Medio', 'Bajo'],
          },
          exampleQuote: { type: SchemaType.STRING },
          suggestion: { type: SchemaType.STRING },
        },
      },
    },
    themes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ['theme', 'totalMentions', 'positiveMentions', 'negativeMentions', 'sentiment'],
        properties: {
          theme: { type: SchemaType.STRING },
          totalMentions: { type: SchemaType.NUMBER },
          positiveMentions: { type: SchemaType.NUMBER },
          negativeMentions: { type: SchemaType.NUMBER },
          sentiment: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['positive', 'neutral', 'negative'],
          },
        },
      },
    },
    temporalAnalysis: {
      type: SchemaType.OBJECT,
      required: ['bestPeriod', 'recentTrend', 'notableChanges'],
      properties: {
        bestPeriod: { type: SchemaType.STRING },
        recentTrend: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['Mejorando', 'Estable', 'Decayendo'],
        },
        notableChanges: { type: SchemaType.STRING },
      },
    },
    customerProfile: {
      type: SchemaType.OBJECT,
      required: ['primaryVisitorType', 'primaryVisitReason', 'expectationsVsReality'],
      properties: {
        primaryVisitorType: { type: SchemaType.STRING },
        primaryVisitReason: { type: SchemaType.STRING },
        expectationsVsReality: { type: SchemaType.STRING },
      },
    },
    recommendations: {
      type: SchemaType.OBJECT,
      required: ['critical', 'shortTerm', 'marketing'],
      properties: {
        critical: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        shortTerm: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        marketing: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
    },
    conclusion: { type: SchemaType.STRING },
  },
};
