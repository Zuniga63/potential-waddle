import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState } from '../dto/trip-state.dto';
import { ChatCard } from '../dto/chat.dto';
import { RafaMessage } from '../entities';
import { ClassifyOutput } from '../dto/classify-output.dto';

/**
 * Response from an expert after handling a query
 */
export interface ExpertResponse {
  /** Natural language response to the user */
  message: string;

  /** Cards to display (entities, budget breakdown, itinerary days, etc.) */
  cards: ChatCard[];

  /** Updates to apply to the trip state */
  stateUpdates: Partial<TripState>;

  /** Follow-up questions to ask the user */
  followUpQuestions: string[];

  /** Suggested actions for the UI */
  suggestedActions: string[];

  /** Whether the expert needs more information to proceed */
  requiresMoreInfo: boolean;
}

/**
 * Context passed to experts for handling queries
 */
export interface ExpertContext {
  message: string;
  intent: RafaIntent;
  state: TripState;
  history: RafaMessage[];
  classification: ClassifyOutput;
  conversationId: string;
}

/**
 * Base class for all Rafa experts.
 * Each expert specializes in a specific domain and handles related intents.
 */
export abstract class BaseExpert {
  /** Display name of the expert */
  abstract readonly name: string;

  /** Description of what this expert does */
  abstract readonly description: string;

  /** List of intents this expert can handle */
  abstract readonly handledIntents: RafaIntent[];

  /**
   * Main method to handle a user query.
   * Each expert implements this with their specialized logic.
   */
  abstract handle(context: ExpertContext): Promise<ExpertResponse>;

  /**
   * Get the system prompt for this expert.
   * Used when generating responses with the LLM.
   */
  abstract getSystemPrompt(state: TripState): string;

  /**
   * Check if this expert can handle a given intent
   */
  canHandle(intent: RafaIntent): boolean {
    return this.handledIntents.includes(intent);
  }

  /**
   * Create a default response when something goes wrong
   */
  protected createErrorResponse(error: string): ExpertResponse {
    return {
      message: `Lo siento, tuve un problema: ${error}. ¿Puedes intentar de nuevo?`,
      cards: [],
      stateUpdates: {},
      followUpQuestions: [],
      suggestedActions: ['Intentar de nuevo'],
      requiresMoreInfo: false,
    };
  }

  /**
   * Format state for prompt context
   */
  protected formatStateForPrompt(state: TripState): string {
    const parts: string[] = [];

    if (state.destination) parts.push(`Destino: ${state.destination}`);
    if (state.partySize) parts.push(`Personas: ${state.partySize}`);
    if (state.days) parts.push(`Días: ${state.days}`);
    if (state.dateFrom) parts.push(`Desde: ${state.dateFrom}`);
    if (state.dateTo) parts.push(`Hasta: ${state.dateTo}`);
    if (state.budgetMin || state.budgetMax) {
      parts.push(`Presupuesto: ${state.budgetMin || 0} - ${state.budgetMax || '∞'} ${state.budgetCurrency}`);
    }
    if (state.tripStyle.length > 0) parts.push(`Estilo: ${state.tripStyle.join(', ')}`);
    if (state.currentGoal) parts.push(`Objetivo actual: ${state.currentGoal}`);

    return parts.length > 0 ? parts.join('\n') : 'Sin contexto definido';
  }

  /**
   * Format last results for prompt context
   */
  protected formatLastResults(state: TripState): string {
    if (!state.lastResults || state.lastResults.items.length === 0) {
      return 'Ninguno';
    }

    return state.lastResults.items
      .map((item, i) => `${i + 1}. ${item.name} (ID: ${item.id})`)
      .join('\n');
  }

  /**
   * Format conversation history for prompt context
   */
  protected formatHistory(history: RafaMessage[], maxMessages = 6): string {
    if (!history || history.length === 0) return 'Sin historial';

    return history
      .slice(-maxMessages)
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Rafa'}: ${m.content}`)
      .join('\n');
  }
}
