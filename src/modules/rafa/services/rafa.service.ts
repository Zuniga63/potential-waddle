import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RafaConversation, RafaMessage, RafaLead } from '../entities';
import { ChatRequestDto, ChatResponseDto, ChatCard, UserContext } from '../dto/chat.dto';
import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState, EMPTY_TRIP_STATE, mergeTripState } from '../dto/trip-state.dto';
import { INTENT_CONFIG, checkIntentRequirements } from '../dto/intent-config';
import { ClassifyOutput } from '../dto/classify-output.dto';
import { LlmService } from './llm.service';
import { ToolsService } from './tools.service';

@Injectable()
export class RafaService {
  private readonly logger = new Logger(RafaService.name);

  constructor(
    @InjectRepository(RafaConversation) private conversationRepo: Repository<RafaConversation>,
    @InjectRepository(RafaMessage) private messageRepo: Repository<RafaMessage>,
    @InjectRepository(RafaLead) private leadRepo: Repository<RafaLead>,
    private readonly llmService: LlmService,
    private readonly toolsService: ToolsService,
  ) {}

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

    // 5. DECIDE - Check if we can execute or need more info
    const intentConfig = INTENT_CONFIG[classification.intent];
    const { canExecute, missingFields } = checkIntentRequirements(classification.intent, updatedState);

    let cards: ChatCard[] = [];
    let response: string;
    let followUpQuestions: string[] = [];

    // 6. EXECUTE - Run tool if we can
    if (canExecute && intentConfig.tool) {
      this.logger.debug(`Executing tool: ${intentConfig.tool}`);
      cards = await this.toolsService.executeTool(
        intentConfig.tool,
        updatedState,
        dto.message,
        {
          selectedPosition: classification.extractedData.selectedPosition ?? undefined,
          selectedName: classification.extractedData.selectedName ?? undefined,
        },
      );

      // Update lastResults in state
      if (cards.length > 0) {
        const entityType = this.getEntityTypeFromTool(intentConfig.tool);
        if (entityType) {
          const simpleResults = this.toolsService.getSimpleResults(cards);
          await this.updateConversationState(conversation.id, {
            ...updatedState,
            lastResults: {
              entityType,
              items: simpleResults,
            },
          });
        }
      }
    }

    // 7. Generate follow-up questions if missing fields
    if (missingFields.length > 0) {
      followUpQuestions = this.generateFollowUpQuestions(classification.intent, missingFields);
    }

    // 8. RESPOND - Generate natural language response
    response = await this.llmService.generateResponse(
      dto.message,
      classification.intent,
      updatedState,
      cards,
      missingFields,
      history,
    );

    // 9. Save assistant message
    await this.saveMessage(conversation.id, 'assistant', response, classification.intent, classification.confidence);

    // 10. Build context update for frontend
    const contextUpdate: UserContext = {
      user_id: userId,
      conversation_id: conversation.id,
      previous_intent: classification.intent,
      collected_params: this.stateToParams(updatedState),
      pending_questions: followUpQuestions,
      session_data: {},
    };

    return {
      message: response,
      intent: classification.intent,
      cards,
      follow_up_questions: followUpQuestions,
      requires_more_info: missingFields.length > 0,
      conversation_complete: classification.intent === RafaIntent.FAREWELL,
      context_update: contextUpdate,
      conversation_id: conversation.id,
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

  private getEntityTypeFromTool(
    tool: string,
  ): 'lodging' | 'restaurant' | 'experience' | 'place' | 'guide' | 'transport' | 'commerce' | null {
    const mapping: Record<string, 'lodging' | 'restaurant' | 'experience' | 'place' | 'guide' | 'transport' | 'commerce'> = {
      searchLodgings: 'lodging',
      searchRestaurants: 'restaurant',
      searchExperiences: 'experience',
      searchPlaces: 'place',
      searchGuides: 'guide',
      searchTransport: 'transport',
      searchCommerce: 'commerce',
    };
    return mapping[tool] || null;
  }

  private generateFollowUpQuestions(intent: RafaIntent, missingFields: string[]): string[] {
    const questions: string[] = [];

    for (const field of missingFields) {
      switch (field) {
        case 'destination':
          questions.push('¿A qué destino te gustaría ir?');
          break;
        case 'days or dates':
          questions.push('¿Cuántos días planeas quedarte o qué fechas tienes en mente?');
          break;
        case 'partySize':
          questions.push('¿Cuántas personas viajan?');
          break;
        case 'one of: contactPhone, contactEmail':
          questions.push('¿Me puedes dar tu teléfono o email para la reserva?');
          break;
        default:
          break;
      }
    }

    return questions.slice(0, 2); // Max 2 follow-up questions
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
