import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RafaConversation, RafaMessage, RafaLead } from '../entities';
import { ChatRequestDto, ChatResponseDto, UserContext } from '../dto/chat.dto';
import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState, EMPTY_TRIP_STATE, mergeTripState } from '../dto/trip-state.dto';
import { ClassifyOutput } from '../dto/classify-output.dto';
import { LlmService } from './llm.service';
import { ToolsService } from './tools.service';
import {
  BaseExpert,
  ExpertContext,
  SearchExpert,
  ConversationExpert,
  BudgetExpert,
  ItineraryExpert,
  LeadExpert,
} from '../experts';

@Injectable()
export class RafaService {
  private readonly logger = new Logger(RafaService.name);
  private readonly experts: BaseExpert[];

  constructor(
    @InjectRepository(RafaConversation) private conversationRepo: Repository<RafaConversation>,
    @InjectRepository(RafaMessage) private messageRepo: Repository<RafaMessage>,
    @InjectRepository(RafaLead) private leadRepo: Repository<RafaLead>,
    private readonly llmService: LlmService,
    private readonly toolsService: ToolsService,
    private readonly searchExpert: SearchExpert,
    private readonly conversationExpert: ConversationExpert,
    private readonly budgetExpert: BudgetExpert,
    private readonly itineraryExpert: ItineraryExpert,
    private readonly leadExpert: LeadExpert,
  ) {
    // Register all experts for routing
    this.experts = [
      this.searchExpert,
      this.conversationExpert,
      this.budgetExpert,
      this.itineraryExpert,
      this.leadExpert,
    ];
  }

  /**
   * Find the expert that can handle the given intent
   */
  private findExpert(intent: RafaIntent): BaseExpert | null {
    return this.experts.find(expert => expert.canHandle(intent)) || null;
  }

  async chat(dto: ChatRequestDto, userId?: string): Promise<ChatResponseDto> {
    // 1. Get or create conversation
    const conversation = await this.getOrCreateConversation(dto.conversation_id, dto.session_id, userId);
    const history = await this.getConversationHistory(conversation.id);

    // 2. Save user message
    await this.saveMessage(conversation.id, 'user', dto.message);

    // 3. CLASSIFY - Get intent and extract data
    const classification = await this.llmService.classifyIntent(dto.message, conversation.state, history);
    this.logger.debug(`Intent: ${classification.intent}, Confidence: ${classification.confidence}`);

    // 4. Update state with extracted data
    const updatedState = await this.updateState(conversation, classification);

    // 5. ROUTE - Find the expert that can handle this intent
    const expert = this.findExpert(classification.intent);

    if (!expert) {
      this.logger.warn(`No expert found for intent: ${classification.intent}`);
      // Fallback to conversation expert for unknown intents
      const fallbackResponse = await this.conversationExpert.handle({
        message: dto.message,
        intent: RafaIntent.UNKNOWN,
        state: updatedState,
        classification,
        conversationId: conversation.id,
        history,
      });

      await this.saveMessage(conversation.id, 'assistant', fallbackResponse.message, classification.intent, classification.confidence);

      return this.buildResponse(
        fallbackResponse,
        classification,
        updatedState,
        conversation.id,
        userId,
      );
    }

    this.logger.debug(`Routing to expert: ${expert.name}`);

    // 6. BUILD CONTEXT - Prepare context for the expert
    const expertContext: ExpertContext = {
      message: dto.message,
      intent: classification.intent,
      state: updatedState,
      classification,
      conversationId: conversation.id,
      history,
    };

    // 7. EXECUTE - Let the expert handle the request
    const expertResponse = await expert.handle(expertContext);

    // 8. UPDATE STATE - Apply any state updates from the expert
    if (expertResponse.stateUpdates && Object.keys(expertResponse.stateUpdates).length > 0) {
      const newState = mergeTripState(updatedState, expertResponse.stateUpdates);
      await this.updateConversationState(conversation.id, newState);
    }

    // 9. Save assistant message
    await this.saveMessage(
      conversation.id,
      'assistant',
      expertResponse.message,
      classification.intent,
      classification.confidence,
    );

    // 10. BUILD RESPONSE - Convert expert response to API response
    return this.buildResponse(
      expertResponse,
      classification,
      updatedState,
      conversation.id,
      userId,
    );
  }

  /**
   * Build the API response from an expert response
   */
  private buildResponse(
    expertResponse: ReturnType<BaseExpert['handle']> extends Promise<infer R> ? R : never,
    classification: ClassifyOutput,
    state: TripState,
    conversationId: string,
    userId?: string,
  ): ChatResponseDto {
    const contextUpdate: UserContext = {
      user_id: userId,
      conversation_id: conversationId,
      previous_intent: classification.intent,
      collected_params: this.stateToParams(state),
      pending_questions: expertResponse.followUpQuestions,
      session_data: {},
    };

    return {
      message: expertResponse.message,
      intent: classification.intent,
      cards: expertResponse.cards,
      follow_up_questions: expertResponse.followUpQuestions,
      requires_more_info: expertResponse.requiresMoreInfo,
      conversation_complete: classification.intent === RafaIntent.FAREWELL,
      context_update: contextUpdate,
      conversation_id: conversationId,
      suggested_actions: expertResponse.suggestedActions,
    };
  }

  private async getOrCreateConversation(
    conversationId?: string,
    sessionId?: string,
    userId?: string,
  ): Promise<RafaConversation> {
    // Only query if conversationId is a valid UUID
    if (conversationId && this.isValidUUID(conversationId)) {
      const existing = await this.conversationRepo.findOne({ where: { id: conversationId } });
      if (existing) return existing;
    }

    // Create new conversation
    const conversation = this.conversationRepo.create({
      userId,
      sessionId,
      state: EMPTY_TRIP_STATE,
      isActive: true,
    });

    return this.conversationRepo.save(conversation);
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private async getConversationHistory(conversationId: string): Promise<RafaMessage[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 20,
    });
  }

  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    intent?: RafaIntent,
    confidence?: number,
  ): Promise<RafaMessage> {
    const message = this.messageRepo.create({
      conversationId,
      role,
      content,
      intent,
      confidence,
    });
    return this.messageRepo.save(message);
  }

  private async updateState(conversation: RafaConversation, classification: ClassifyOutput): Promise<TripState> {
    const extracted = classification.extractedData;
    const updates: Partial<TripState> = {};

    // Map extracted data to state
    if (extracted.destination) {
      updates.destination = extracted.destination;
      const townId = await this.toolsService.resolveTownId(extracted.destination);
      if (townId) updates.townId = townId;
    }
    if (extracted.partySize) updates.partySize = extracted.partySize;
    if (extracted.dateFrom) updates.dateFrom = new Date(extracted.dateFrom);
    if (extracted.dateTo) updates.dateTo = new Date(extracted.dateTo);
    if (extracted.days) updates.days = extracted.days;
    if (extracted.budgetMin) updates.budgetMin = extracted.budgetMin;
    if (extracted.budgetMax) updates.budgetMax = extracted.budgetMax;
    if (extracted.tripStyle && extracted.tripStyle.length > 0) updates.tripStyle = extracted.tripStyle;
    if (extracted.tags && extracted.tags.length > 0) updates.tags = extracted.tags;
    if (extracted.contactPhone) updates.contactPhone = extracted.contactPhone;
    if (extracted.contactEmail) updates.contactEmail = extracted.contactEmail;

    // Update current goal based on intent
    updates.currentGoal = this.intentToGoal(classification.intent);

    // Merge with existing state
    const newState = mergeTripState(conversation.state, updates);

    // Persist to database
    await this.updateConversationState(conversation.id, newState);

    return newState;
  }

  private async updateConversationState(conversationId: string, state: TripState): Promise<void> {
    await this.conversationRepo.update(conversationId, { state });
  }

  private intentToGoal(intent: RafaIntent): string {
    const goals: Record<RafaIntent, string> = {
      [RafaIntent.FIND_LODGING]: 'Buscando alojamiento',
      [RafaIntent.FIND_RESTAURANT]: 'Buscando restaurante',
      [RafaIntent.FIND_EXPERIENCE]: 'Buscando experiencias',
      [RafaIntent.FIND_PLACE]: 'Buscando lugares mágicos',
      [RafaIntent.FIND_GUIDE]: 'Buscando guía turístico',
      [RafaIntent.FIND_TRANSPORT]: 'Buscando transporte',
      [RafaIntent.FIND_COMMERCE]: 'Buscando comercios',
      [RafaIntent.BUILD_ITINERARY]: 'Construyendo itinerario',
      [RafaIntent.ESTIMATE_BUDGET]: 'Estimando presupuesto',
      [RafaIntent.CREATE_LEAD]: 'Creando reserva',
      [RafaIntent.SELECT_ENTITY]: 'Seleccionando opción',
      [RafaIntent.GREETING]: 'Conversando',
      [RafaIntent.FAREWELL]: 'Despidiéndose',
      [RafaIntent.GENERAL_QUESTION]: 'Respondiendo pregunta',
      [RafaIntent.UNKNOWN]: 'Procesando',
    };
    return goals[intent] || 'Procesando';
  }

  private stateToParams(state: TripState): Record<string, unknown> {
    return {
      destination: state.destination,
      townId: state.townId,
      partySize: state.partySize,
      dateFrom: state.dateFrom?.toISOString(),
      dateTo: state.dateTo?.toISOString(),
      days: state.days,
      budgetMin: state.budgetMin,
      budgetMax: state.budgetMax,
      tripStyle: state.tripStyle,
      currentGoal: state.currentGoal,
    };
  }

  // Lead creation
  async createLead(
    conversationId: string,
    entityType: 'lodging' | 'restaurant' | 'experience' | 'guide' | 'transport' | 'commerce',
    entityId: string,
  ): Promise<RafaLead> {
    const conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!conversation) throw new Error('Conversation not found');

    const lead = this.leadRepo.create({
      conversationId,
      entityType,
      entityId,
      contactPhone: conversation.state.contactPhone || undefined,
      contactEmail: conversation.state.contactEmail || undefined,
      stateSnapshot: conversation.state,
      status: 'pending',
    });

    return this.leadRepo.save(lead);
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<RafaConversation | null> {
    return this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['messages', 'leads'],
    });
  }
}
