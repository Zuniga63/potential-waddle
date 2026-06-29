import { Logger } from '@nestjs/common';
import { GoogleGenerativeAI, Schema } from '@google/generative-ai';

const logger = new Logger('GeminiStructuredFallback');

/**
 * Model escalation chain.
 *
 * We start with whatever cheap model is configured (typically gemini-2.5-flash-lite)
 * and, when it is overloaded (503) or rate-limited (429), escalate to progressively
 * more powerful models. Review-summary generation is a low-frequency, high-value action,
 * so paying for a stronger model on the rare retry is acceptable.
 */
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];

/** HTTP status codes that warrant a retry / model escalation. */
const TRANSIENT_STATUS = [429, 500, 502, 503, 504];

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A transient error is one where retrying (same model) or escalating (stronger model)
 * could succeed: server overload, rate limits, gateway errors. A 400 (bad schema) or
 * 401/403 (auth) is NOT transient — escalating models would fail identically.
 */
function isTransientError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (TRANSIENT_STATUS.some(code => msg.includes(`[${code} `) || msg.includes(`${code} Service`))) {
    return true;
  }
  return /high demand|overloaded|service unavailable|try again later|rate limit|quota|deadline exceeded/i.test(msg);
}

interface GenerateStructuredParams {
  apiKey: string;
  /** Configured primary model (e.g. gemini-2.5-flash-lite). Tried first. */
  primaryModel: string;
  prompt: string;
  responseSchema: Schema;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Generate structured JSON from Gemini with a resilient model-fallback chain.
 *
 * For each model in [primary, ...FALLBACK_MODELS]: try once, on a transient failure wait
 * briefly and retry once on the same model, then escalate to the next (more powerful) model.
 * Returns the raw JSON text. Throws the last error if every model in the chain fails, or
 * immediately on a non-transient error (e.g. bad schema).
 */
export async function generateStructuredAnalysis({
  apiKey,
  primaryModel,
  prompt,
  responseSchema,
  temperature = 0.7,
  maxOutputTokens = 8000,
}: GenerateStructuredParams): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Configured model first, then stronger fallbacks — deduped so a primary that already
  // equals a fallback isn't tried twice in a row.
  const modelChain = [primaryModel, ...FALLBACK_MODELS].filter((model, index, arr) => arr.indexOf(model) === index);

  let lastError: unknown;

  for (const modelName of modelChain) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    // Two attempts per model: a quick same-model retry clears most short-lived blips
    // before we pay for a more expensive model.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        logger.log(`🤖 Gemini structured request → ${modelName} (attempt ${attempt})`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        logger.log(`✅ Gemini structured response from ${modelName} (${text.length} chars)`);
        return text;
      } catch (error) {
        lastError = error;
        if (!isTransientError(error)) {
          throw error;
        }
        const firstLine = error instanceof Error ? error.message.split('\n')[0] : String(error);
        logger.warn(`⚠️ ${modelName} transient failure (attempt ${attempt}): ${firstLine}`);
        if (attempt < 2) {
          await sleep(1500 * attempt);
        }
      }
    }

    logger.warn(`↪️ Escalating from ${modelName} to the next model in the fallback chain`);
  }

  logger.error('All Gemini models in the fallback chain failed.');
  throw lastError instanceof Error
    ? lastError
    : new Error('Gemini structured generation failed across all fallback models');
}
