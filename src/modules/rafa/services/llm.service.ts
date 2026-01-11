import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState } from '../dto/trip-state.dto';
import { ClassifyOutput, ClassifyOutputSchema, CLASSIFY_JSON_SCHEMA } from '../dto/classify-output.dto';
import { ChatCard } from '../dto/chat.dto';
import { RafaMessage } from '../entities';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });
  }

  async classifyIntent(userMessage: string, state: TripState, history: RafaMessage[]): Promise<ClassifyOutput> {
    const systemPrompt = this.buildClassifyPrompt(state, history);

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: `User message: "${userMessage}"` },
      ]);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      // Normalize intent to lowercase (Gemini sometimes returns uppercase)
      if (parsed.intent && typeof parsed.intent === 'string') {
        parsed.intent = parsed.intent.toLowerCase();
      }

      this.logger.debug(`Raw LLM response intent: ${parsed.intent}`);

      // Validar con Zod
      const validated = ClassifyOutputSchema.parse(parsed);
      this.logger.debug(`Classified intent: ${validated.intent} (confidence: ${validated.confidence})`);

      return validated;
    } catch (error) {
      this.logger.error(`Error classifying intent: ${error.message}`);
      return {
        intent: RafaIntent.UNKNOWN,
        confidence: 0,
        extractedData: { tripStyle: [], tags: [] },
        reasoning: `Classification error: ${error.message}`,
      };
    }
  }

  async generateResponse(
    userMessage: string,
    intent: RafaIntent,
    state: TripState,
    cards: ChatCard[],
    missingFields: string[],
    history: RafaMessage[],
  ): Promise<string> {
    const systemPrompt = this.buildResponsePrompt(intent, state, cards, missingFields, history);

    try {
      const chatModel = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const result = await chatModel.generateContent([
        { text: systemPrompt },
        { text: `User: "${userMessage}"` },
      ]);

      return result.response.text();
    } catch (error) {
      this.logger.error(`Error generating response: ${error.message}`);
      return 'Lo siento, tuve un problema procesando tu solicitud. ¿Podrías intentar de nuevo?';
    }
  }

  private buildClassifyPrompt(state: TripState, history: RafaMessage[]): string {
    const intents = Object.values(RafaIntent).join(', ');
    const historyContext = this.formatHistory(history);
    const stateContext = this.formatState(state);

    return `You are an intent classifier for Rafa, a tourism assistant for Colombia.
Your task is to classify the user's message into one of these intents: ${intents}

Current conversation state:
${stateContext}

Recent conversation history:
${historyContext}

Classification guidelines:
- FIND_LODGING: User wants NEW search for hotels, hostels, cabins, or accommodation
- FIND_RESTAURANT: User wants NEW search for restaurants, cafes, or places to eat
- FIND_EXPERIENCE: User wants NEW search for activities, tours, or things to do
- FIND_PLACE: User wants NEW search for magical places, attractions, or landmarks
- FIND_GUIDE: User wants a NEW search for tour guide
- FIND_TRANSPORT: User needs NEW search for transportation services
- FIND_COMMERCE: User wants NEW search for shops, stores, or shopping options
- BUILD_ITINERARY: User wants a complete trip plan or itinerary
- ESTIMATE_BUDGET: User wants to know costs or budget for a trip
- CREATE_LEAD: User wants to book, reserve, or contact a business
- SELECT_ENTITY: User is SELECTING/CHOOSING from previous results. Use this when:
  * User uses superlatives: "el más caro", "el más barato", "el mejor valorado", "el más económico"
  * User references position: "el primero", "el segundo", "la tercera opción"
  * User references by name: a name from previous results
  * User says "ese", "esa", "ese mismo", "quiero ese"
  * IMPORTANT: If there are lastResults in state and user is filtering/selecting, use SELECT_ENTITY
- GREETING: User is greeting or starting conversation
- FAREWELL: User is ending conversation or saying goodbye
- GENERAL_QUESTION: General questions about Colombia, towns, or travel tips
- UNKNOWN: Cannot determine intent

Extract any data mentioned: destination, party size, dates, budget, preferences, etc.

Respond ONLY with valid JSON matching this schema:
${JSON.stringify(CLASSIFY_JSON_SCHEMA, null, 2)}`;
  }

  private buildResponsePrompt(
    intent: RafaIntent,
    state: TripState,
    cards: ChatCard[],
    missingFields: string[],
    history: RafaMessage[],
  ): string {
    const historyContext = this.formatHistory(history);
    const stateContext = this.formatState(state);
    const resultsContext = cards.length > 0 ? this.formatCards(cards) : 'No results available';

    let instructions = '';

    if (missingFields.length > 0) {
      instructions = `Ask the user for the following missing information: ${missingFields.join(', ')}.
Be conversational and natural. Don't list all fields at once - ask one or two at a time.`;
    } else if (cards.length > 0) {
      instructions = `Present the search results to the user in a friendly, conversational way.
Highlight key features and help them choose. Number the options so they can select easily.`;
    } else if (intent === RafaIntent.GREETING) {
      instructions = `Greet the user warmly. Introduce yourself as Rafa, their Colombian tourism assistant.
Ask how you can help them plan their trip.`;
    } else if (intent === RafaIntent.FAREWELL) {
      instructions = `Say goodbye warmly. Wish them a great trip to Colombia.`;
    } else {
      instructions = `Respond helpfully based on the context. If you can't help, explain why and suggest alternatives.`;
    }

    return `You are Rafa, a friendly Colombian tourism assistant. You help travelers discover the magic of Colombia.

Personality:
- Warm, enthusiastic, and knowledgeable about Colombia
- Use casual but respectful Spanish (tuteo)
- Occasionally use Colombian expressions naturally
- Keep responses concise (2-4 sentences usually)

Current conversation state:
${stateContext}

Recent history:
${historyContext}

Search results:
${resultsContext}

Intent: ${intent}

Instructions: ${instructions}

Respond naturally in Spanish. Do NOT include JSON or technical information.`;
  }

  private formatHistory(history: RafaMessage[]): string {
    if (!history || history.length === 0) return 'No previous messages';

    return history
      .slice(-6) // Last 6 messages
      .map(m => `${m.role === 'user' ? 'User' : 'Rafa'}: ${m.content}`)
      .join('\n');
  }

  private formatState(state: TripState): string {
    const parts: string[] = [];

    if (state.destination) parts.push(`Destination: ${state.destination}`);
    if (state.partySize) parts.push(`Party size: ${state.partySize}`);
    if (state.dateFrom) parts.push(`From: ${state.dateFrom}`);
    if (state.dateTo) parts.push(`To: ${state.dateTo}`);
    if (state.days) parts.push(`Days: ${state.days}`);
    if (state.budgetMin || state.budgetMax) {
      parts.push(`Budget: ${state.budgetMin || 0} - ${state.budgetMax || '∞'} ${state.budgetCurrency}`);
    }
    if (state.tripStyle.length > 0) parts.push(`Style: ${state.tripStyle.join(', ')}`);
    if (state.currentGoal) parts.push(`Current goal: ${state.currentGoal}`);

    // Include lastResults so LLM knows there are previous results for SELECT_ENTITY
    if (state.lastResults && state.lastResults.items.length > 0) {
      parts.push(`\nPrevious results (${state.lastResults.entityType}):`);
      state.lastResults.items.forEach((item, i) => {
        parts.push(`  ${i + 1}. ${item.name} (id: ${item.id})`);
      });
    }

    return parts.length > 0 ? parts.join('\n') : 'No context yet';
  }

  private formatCards(cards: ChatCard[]): string {
    return cards
      .map((c, i) => {
        const name = c.data?.name || c.data?.title || c.title;
        const rating = c.data?.rating;
        const price = c.data?.lowestPrice || c.data?.price;
        return `${i + 1}. ${name} (${c.type})${rating ? ` - ★${rating}` : ''}${price ? ` - $${price}` : ''}`;
      })
      .join('\n');
  }

  /**
   * Generate a response using a custom system prompt from an expert.
   * This allows experts to have full control over their prompts.
   */
  async generateExpertResponse(
    systemPrompt: string,
    userMessage: string,
    cards: ChatCard[],
    history: RafaMessage[],
    additionalContext?: Record<string, unknown>,
  ): Promise<string> {
    try {
      const chatModel = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      // Build full prompt with context
      let fullPrompt = systemPrompt;

      // Add history context
      if (history && history.length > 0) {
        fullPrompt += `\n\nHISTORIAL RECIENTE:\n${this.formatHistory(history)}`;
      }

      // Add cards/results context
      if (cards && cards.length > 0) {
        fullPrompt += `\n\nRESULTADOS ENCONTRADOS:\n${this.formatCards(cards)}`;
      }

      // Add any additional context
      if (additionalContext) {
        fullPrompt += `\n\nCONTEXTO ADICIONAL:\n${JSON.stringify(additionalContext, null, 2)}`;
      }

      fullPrompt += `\n\nResponde en español de forma natural y amigable. NO incluyas JSON ni información técnica.`;

      const result = await chatModel.generateContent([
        { text: fullPrompt },
        { text: `Usuario: "${userMessage}"` },
      ]);

      return result.response.text();
    } catch (error) {
      this.logger.error(`Error generating expert response: ${error.message}`);
      return 'Lo siento, tuve un problema procesando tu solicitud. ¿Podrías intentar de nuevo?';
    }
  }
}
