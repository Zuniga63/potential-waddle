import { Injectable, Logger } from '@nestjs/common';

import { BaseExpert, ExpertContext, ExpertResponse } from './base.expert';
import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState } from '../dto/trip-state.dto';
import { LlmService } from '../services/llm.service';
import { ToolsService } from '../services/tools.service';

/**
 * Conversation Expert - Handles general conversation
 *
 * Specializes in:
 * - Greetings and introductions
 * - Farewells and trip summaries
 * - General questions about Colombia, towns, travel tips
 * - Unknown intents (fallback)
 */
@Injectable()
export class ConversationExpert extends BaseExpert {
  private readonly logger = new Logger(ConversationExpert.name);

  readonly name = 'Experto en Conversación';
  readonly description = 'Maneja saludos, despedidas y preguntas generales sobre turismo';

  readonly handledIntents = [
    RafaIntent.GREETING,
    RafaIntent.FAREWELL,
    RafaIntent.GENERAL_QUESTION,
    RafaIntent.UNKNOWN,
  ];

  constructor(
    private readonly llmService: LlmService,
    private readonly toolsService: ToolsService,
  ) {
    super();
  }

  getSystemPrompt(state: TripState): string {
    const hasContext = state.destination || state.selectedLodging || state.selectedRestaurant;

    return `Eres Rafa, asistente turístico de Binntu para Colombia.

PERSONALIDAD:
- Cálido, entusiasta y conocedor de Colombia
- Usas español informal (tuteo) pero respetuoso
- Ocasionalmente usas expresiones colombianas naturalmente
- Respuestas concisas (2-4 oraciones)

${hasContext ? `CONTEXTO DEL VIAJE:
${this.formatStateForPrompt(state)}` : ''}

TU CONOCIMIENTO:
- Pueblos de Antioquia: San Rafael, Guatapé, Jardín, Santa Fe, Jericó, El Retiro
- Actividades: cascadas, embalses, senderismo, gastronomía, cultura
- Tips de viaje: mejor época, cómo llegar, qué llevar

DESTINOS DESTACADOS:
- **San Rafael**: Cascadas, embalse, naturaleza, deportes acuáticos
- **Guatapé**: Piedra del Peñol, pueblo colorido, vida nocturna
- **Jardín**: Café, arquitectura colonial, avistamiento de aves
- **Santa Fe de Antioquia**: Pueblito histórico, clima cálido, puente de occidente

INSTRUCCIONES:
- En saludos: preséntate brevemente y pregunta cómo ayudar
- En despedidas: resume el plan si hay selecciones, desea buen viaje
- En preguntas generales: responde con info útil y ofrece buscar opciones
- Siempre guía hacia una acción: buscar hotel, ver experiencias, etc.`;
  }

  async handle(context: ExpertContext): Promise<ExpertResponse> {
    const { message, state, classification, history } = context;
    const intent = classification.intent;

    this.logger.debug(`ConversationExpert handling intent: ${intent}`);

    try {
      switch (intent) {
        case RafaIntent.GREETING:
          return this.handleGreeting(state);

        case RafaIntent.FAREWELL:
          return this.handleFarewell(state);

        case RafaIntent.GENERAL_QUESTION:
          return this.handleGeneralQuestion(message, state, history);

        case RafaIntent.UNKNOWN:
        default:
          return this.handleUnknown(message, state, history);
      }
    } catch (error) {
      this.logger.error(`ConversationExpert error: ${error.message}`);
      return this.createErrorResponse(error.message);
    }
  }

  private async handleGreeting(state: TripState): Promise<ExpertResponse> {
    let message: string;
    const followUps: string[] = [];
    const suggestedActions: string[] = [];

    if (state.destination) {
      // User already has a destination
      message = `¡Hola de nuevo! 👋 Veo que estás planeando tu viaje a **${state.destination}**.`;

      if (state.selectedLodging) {
        message += ` Ya tienes alojamiento seleccionado.`;
        if (!state.selectedRestaurant) {
          followUps.push('¿Buscamos dónde comer?');
          suggestedActions.push('Buscar restaurantes');
        }
        if (state.selectedExperiences.length === 0) {
          followUps.push('¿Vemos qué experiencias hay?');
          suggestedActions.push('Ver experiencias');
        }
      } else {
        message += ` ¿Empezamos buscando dónde hospedarte?`;
        followUps.push('Buscar hoteles');
        followUps.push('Ver opciones económicas');
        suggestedActions.push('Buscar alojamiento');
      }
    } else {
      // New conversation
      message = `¡Hola! 👋 Soy **Rafa**, tu asistente de viajes en Colombia.

Puedo ayudarte a:
🏨 Encontrar el alojamiento perfecto
🍽️ Descubrir los mejores restaurantes
🎯 Planear experiencias increíbles
📍 Conocer lugares mágicos

¿A dónde te gustaría viajar? Te recomiendo **San Rafael** para naturaleza, **Guatapé** para aventura, o **Jardín** para café y cultura.`;

      followUps.push('Quiero ir a San Rafael');
      followUps.push('¿Qué destinos me recomiendas?');
      suggestedActions.push('Ver destinos', 'Buscar hoteles', 'Planear viaje');
    }

    return {
      message,
      cards: [],
      stateUpdates: { currentGoal: 'Iniciando conversación' },
      followUpQuestions: followUps.slice(0, 2),
      suggestedActions,
      requiresMoreInfo: false,
    };
  }

  private async handleFarewell(state: TripState): Promise<ExpertResponse> {
    let message = '¡Hasta pronto! 👋 ';

    const hasSelections =
      state.selectedLodging ||
      state.selectedRestaurant ||
      state.selectedExperiences.length > 0 ||
      state.selectedGuide ||
      state.selectedTransport;

    if (hasSelections) {
      message += 'Tu plan de viaje incluye:\n\n';

      if (state.destination) {
        message += `📍 **Destino:** ${state.destination}\n`;
      }
      if (state.days) {
        message += `📅 **Días:** ${state.days}\n`;
      }
      if (state.selectedLodging) {
        message += `🏨 **Alojamiento:** Seleccionado\n`;
      }
      if (state.selectedRestaurant) {
        message += `🍽️ **Restaurante:** Seleccionado\n`;
      }
      if (state.selectedExperiences.length > 0) {
        message += `🎯 **Experiencias:** ${state.selectedExperiences.length} seleccionadas\n`;
      }
      if (state.selectedGuide) {
        message += `🧭 **Guía:** Seleccionado\n`;
      }
      if (state.selectedTransport) {
        message += `🚗 **Transporte:** Seleccionado\n`;
      }

      message += '\n¡Que tengas un viaje increíble! 🇨🇴';
    } else {
      message += 'Fue un gusto ayudarte. ¡Vuelve cuando quieras planear tu próximo viaje a Colombia! 🇨🇴';
    }

    return {
      message,
      cards: [],
      stateUpdates: { currentGoal: 'Conversación finalizada' },
      followUpQuestions: [],
      suggestedActions: ['Nuevo viaje'],
      requiresMoreInfo: false,
    };
  }

  private async handleGeneralQuestion(
    userMessage: string,
    state: TripState,
    history: any[],
  ): Promise<ExpertResponse> {
    // Check if it's a question about a specific destination
    const destinations = ['san rafael', 'guatapé', 'guatape', 'jardín', 'jardin', 'santa fe', 'jericó', 'jerico'];
    const messageLower = userMessage.toLowerCase();
    const mentionedDest = destinations.find(d => messageLower.includes(d));

    // Use RAG search if it seems like a specific question
    let ragResults: any[] = [];
    if (mentionedDest || messageLower.includes('qué') || messageLower.includes('cómo') || messageLower.includes('donde')) {
      try {
        ragResults = await this.toolsService.executeTool('ragSearch', state, userMessage);
      } catch (e) {
        this.logger.warn(`RAG search failed: ${e.message}`);
      }
    }

    // Generate response with LLM
    const response = await this.llmService.generateExpertResponse(
      this.getSystemPrompt(state),
      userMessage,
      ragResults,
      history,
    );

    // Update destination if mentioned
    const stateUpdates: Partial<TripState> = {};
    if (mentionedDest) {
      stateUpdates.destination = mentionedDest.charAt(0).toUpperCase() + mentionedDest.slice(1);
      // Try to resolve town ID
      const townId = await this.toolsService.resolveTownId(mentionedDest);
      if (townId) stateUpdates.townId = townId;
    }

    return {
      message: response,
      cards: ragResults.slice(0, 3), // Show up to 3 relevant results
      stateUpdates,
      followUpQuestions: [
        state.destination ? '¿Buscamos hoteles?' : '¿A qué destino te gustaría ir?',
        '¿Qué tipo de experiencias te interesan?',
      ],
      suggestedActions: ['Buscar hoteles', 'Ver experiencias', 'Más información'],
      requiresMoreInfo: false,
    };
  }

  private async handleUnknown(
    userMessage: string,
    state: TripState,
    history: any[],
  ): Promise<ExpertResponse> {
    // Try to be helpful even with unknown intent
    const response = await this.llmService.generateExpertResponse(
      this.getSystemPrompt(state) + `

NOTA: No entendí bien la solicitud. Responde amablemente y guía al usuario hacia algo que puedas ayudar:
- Buscar alojamiento, restaurantes, experiencias
- Responder preguntas sobre destinos
- Ayudar a planear el viaje`,
      userMessage,
      [],
      history,
    );

    return {
      message: response,
      cards: [],
      stateUpdates: {},
      followUpQuestions: [
        '¿Quieres buscar hoteles?',
        '¿Te cuento sobre algún destino?',
      ],
      suggestedActions: ['Buscar alojamiento', 'Ver destinos', 'Planear viaje'],
      requiresMoreInfo: false,
    };
  }
}
