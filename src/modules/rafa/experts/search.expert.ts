import { Injectable, Logger } from '@nestjs/common';

import { BaseExpert, ExpertContext, ExpertResponse } from './base.expert';
import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState } from '../dto/trip-state.dto';
import { ToolsService } from '../services/tools.service';
import { LlmService } from '../services/llm.service';
import { ToolName } from '../dto/intent-config';

/**
 * Search Expert - Handles all entity search operations
 *
 * Specializes in finding:
 * - Lodgings (hotels, hostels, cabins, glamping)
 * - Restaurants (cafes, food places)
 * - Experiences (tours, activities)
 * - Places (magical places, attractions)
 * - Guides (tour guides)
 * - Transport (drivers, transport services)
 * - Commerce (shops, stores)
 *
 * Also handles entity selection from previous results.
 */
@Injectable()
export class SearchExpert extends BaseExpert {
  private readonly logger = new Logger(SearchExpert.name);

  readonly name = 'Experto en Búsquedas';
  readonly description =
    'Encuentra hoteles, restaurantes, experiencias, lugares mágicos, guías, transporte y comercios';

  readonly handledIntents = [
    RafaIntent.FIND_LODGING,
    RafaIntent.FIND_RESTAURANT,
    RafaIntent.FIND_EXPERIENCE,
    RafaIntent.FIND_PLACE,
    RafaIntent.FIND_GUIDE,
    RafaIntent.FIND_TRANSPORT,
    RafaIntent.FIND_COMMERCE,
    RafaIntent.SELECT_ENTITY,
  ];

  constructor(
    private readonly toolsService: ToolsService,
    private readonly llmService: LlmService,
  ) {
    super();
  }

  getSystemPrompt(state: TripState): string {
    return `Eres Rafa, experto en turismo de Colombia y asistente de Binntu.

PERSONALIDAD:
- Amigable, entusiasta y conocedor de Colombia
- Usas español informal (tuteo) pero respetuoso
- Respuestas concisas (2-4 oraciones máximo antes de listar)
- Destacas lo mejor de cada opción

CONTEXTO DEL VIAJE:
${this.formatStateForPrompt(state)}

ÚLTIMOS RESULTADOS MOSTRADOS:
${this.formatLastResults(state)}

INSTRUCCIONES PARA BÚSQUEDAS:
1. Presenta los resultados de forma atractiva y numerada
2. Destaca: rating (★), precio, y 1-2 características únicas
3. Si no hay resultados, sugiere ampliar búsqueda o cambiar filtros
4. Si el usuario selecciona ("el primero", "el más barato"), confirma la selección

FORMATO DE RESPUESTA:
- Inicia con una frase breve de contexto
- Lista las opciones numeradas
- Termina preguntando cuál le interesa o si quiere más detalles

EJEMPLO:
"¡Encontré 3 hoteles geniales en San Rafael! 🏨

1. **Hotel Lago Azul** - ★4.8 - $150,000/noche
   Vista al lago, piscina, desayuno incluido

2. **Cabañas del Bosque** - ★4.5 - $120,000/noche
   Ambiente tranquilo, chimenea, ideal parejas

3. **Hostal Aventura** - ★4.2 - $60,000/noche
   Económico, cerca del centro, buen WiFi

¿Cuál te llama la atención? Puedo darte más detalles de cualquiera."`;
  }

  async handle(context: ExpertContext): Promise<ExpertResponse> {
    const { message, state, classification } = context;
    const intent = classification.intent;

    this.logger.debug(`SearchExpert handling intent: ${intent}`);

    try {
      // Determine which tool to use
      const toolName = this.getToolForIntent(intent);
      if (!toolName) {
        return this.createErrorResponse('No pude determinar qué buscar');
      }

      // Execute search
      const cards = await this.toolsService.executeTool(toolName, state, message, {
        selectedPosition: classification.extractedData.selectedPosition ?? undefined,
        selectedName: classification.extractedData.selectedName ?? undefined,
      });

      this.logger.debug(`Search returned ${cards.length} results`);

      // Generate natural language response
      const response = await this.llmService.generateExpertResponse(
        this.getSystemPrompt(state),
        message,
        cards,
        context.history,
      );

      // Build state updates
      const stateUpdates: Partial<TripState> = {};

      if (cards.length > 0) {
        const entityType = this.getEntityTypeFromIntent(intent);
        if (entityType) {
          stateUpdates.lastResults = {
            entityType,
            items: cards.map((c, i) => ({
              id: c.id || '',
              name: c.title,
              position: i + 1,
            })),
          };
        }

        // If SELECT_ENTITY and only 1 card, mark as selected
        if (intent === RafaIntent.SELECT_ENTITY && cards.length === 1) {
          const selectedCard = cards[0];
          switch (selectedCard.type) {
            case 'lodging':
              stateUpdates.selectedLodging = selectedCard.id;
              break;
            case 'restaurant':
              stateUpdates.selectedRestaurant = selectedCard.id;
              break;
            case 'guide':
              stateUpdates.selectedGuide = selectedCard.id;
              break;
            case 'transport':
              stateUpdates.selectedTransport = selectedCard.id;
              break;
            case 'experience':
              if (!state.selectedExperiences.includes(selectedCard.id || '')) {
                stateUpdates.selectedExperiences = [...state.selectedExperiences, selectedCard.id || ''];
              }
              break;
          }
        }
      }

      // Update current goal
      stateUpdates.currentGoal = this.getGoalForIntent(intent);

      return {
        message: response,
        cards,
        stateUpdates,
        followUpQuestions: this.generateFollowUps(intent, cards, state),
        suggestedActions: this.generateSuggestedActions(intent, cards),
        requiresMoreInfo: false,
      };
    } catch (error) {
      this.logger.error(`SearchExpert error: ${error.message}`);
      return this.createErrorResponse(error.message);
    }
  }

  private getToolForIntent(intent: RafaIntent): ToolName | null {
    const mapping: Record<string, ToolName> = {
      [RafaIntent.FIND_LODGING]: 'searchLodgings',
      [RafaIntent.FIND_RESTAURANT]: 'searchRestaurants',
      [RafaIntent.FIND_EXPERIENCE]: 'searchExperiences',
      [RafaIntent.FIND_PLACE]: 'searchPlaces',
      [RafaIntent.FIND_GUIDE]: 'searchGuides',
      [RafaIntent.FIND_TRANSPORT]: 'searchTransport',
      [RafaIntent.FIND_COMMERCE]: 'searchCommerce',
      [RafaIntent.SELECT_ENTITY]: 'selectEntity',
    };
    return mapping[intent] || null;
  }

  private getEntityTypeFromIntent(
    intent: RafaIntent,
  ): 'lodging' | 'restaurant' | 'experience' | 'place' | 'guide' | 'transport' | 'commerce' | null {
    const mapping: Record<
      string,
      'lodging' | 'restaurant' | 'experience' | 'place' | 'guide' | 'transport' | 'commerce'
    > = {
      [RafaIntent.FIND_LODGING]: 'lodging',
      [RafaIntent.FIND_RESTAURANT]: 'restaurant',
      [RafaIntent.FIND_EXPERIENCE]: 'experience',
      [RafaIntent.FIND_PLACE]: 'place',
      [RafaIntent.FIND_GUIDE]: 'guide',
      [RafaIntent.FIND_TRANSPORT]: 'transport',
      [RafaIntent.FIND_COMMERCE]: 'commerce',
    };
    return mapping[intent] || null;
  }

  private getGoalForIntent(intent: RafaIntent): string {
    const goals: Record<string, string> = {
      [RafaIntent.FIND_LODGING]: 'Buscando alojamiento',
      [RafaIntent.FIND_RESTAURANT]: 'Buscando restaurante',
      [RafaIntent.FIND_EXPERIENCE]: 'Buscando experiencias',
      [RafaIntent.FIND_PLACE]: 'Buscando lugares mágicos',
      [RafaIntent.FIND_GUIDE]: 'Buscando guía',
      [RafaIntent.FIND_TRANSPORT]: 'Buscando transporte',
      [RafaIntent.FIND_COMMERCE]: 'Buscando comercios',
      [RafaIntent.SELECT_ENTITY]: 'Seleccionando opción',
    };
    return goals[intent] || 'Buscando';
  }

  private generateFollowUps(intent: RafaIntent, cards: any[], state: TripState): string[] {
    if (cards.length === 0) {
      return ['¿Quieres buscar en otro destino?', '¿Ajustamos el presupuesto?'];
    }

    if (intent === RafaIntent.SELECT_ENTITY && cards.length === 1) {
      return [
        '¿Quieres reservar este lugar?',
        '¿Buscamos opciones de comida cerca?',
        '¿Vemos experiencias disponibles?',
      ];
    }

    const followUps: string[] = [];

    // Suggest based on what's not yet selected
    if (!state.selectedLodging && intent !== RafaIntent.FIND_LODGING) {
      followUps.push('¿Buscamos dónde hospedarte?');
    }
    if (!state.selectedRestaurant && state.selectedLodging) {
      followUps.push('¿Buscamos dónde comer?');
    }
    if (state.selectedLodging && state.selectedRestaurant) {
      followUps.push('¿Creamos un itinerario?');
    }

    if (followUps.length === 0) {
      followUps.push('¿Te muestro más detalles de alguno?');
      followUps.push('¿Quieres ver más opciones?');
    }

    return followUps.slice(0, 2);
  }

  private generateSuggestedActions(intent: RafaIntent, cards: any[]): string[] {
    if (cards.length === 0) {
      return ['Ampliar búsqueda', 'Cambiar filtros', 'Otro destino'];
    }

    return ['Ver detalles', 'Más opciones', 'Filtrar por precio', 'Agregar al plan'];
  }
}
