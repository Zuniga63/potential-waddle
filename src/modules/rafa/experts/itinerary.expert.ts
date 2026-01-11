import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseExpert, ExpertContext, ExpertResponse } from './base.expert';
import { RafaIntent } from '../dto/rafa-intent.enum';
import { TripState } from '../dto/trip-state.dto';
import { ChatCard } from '../dto/chat.dto';
import { LlmService } from '../services/llm.service';
import { Lodging } from 'src/modules/lodgings/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Place } from 'src/modules/places/entities';

/**
 * Day plan structure
 */
interface DayPlan {
  day: number;
  title: string;
  activities: {
    time: string;
    activity: string;
    type: 'lodging' | 'restaurant' | 'experience' | 'place' | 'transport' | 'free';
    entityId?: string;
    duration?: string;
    notes?: string;
  }[];
}

/**
 * Itinerary Expert - Creates day-by-day trip plans
 *
 * Specializes in:
 * - Creating optimized itineraries
 * - Organizing activities by proximity
 * - Balancing activities and rest
 * - Including meal suggestions
 */
@Injectable()
export class ItineraryExpert extends BaseExpert {
  private readonly logger = new Logger(ItineraryExpert.name);

  readonly name = 'Experto en Itinerarios';
  readonly description = 'Crea planes de viaje día a día optimizados';

  readonly handledIntents = [RafaIntent.BUILD_ITINERARY];

  constructor(
    private readonly llmService: LlmService,
    @InjectRepository(Lodging) private lodgingRepo: Repository<Lodging>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Experience) private experienceRepo: Repository<Experience>,
    @InjectRepository(Place) private placeRepo: Repository<Place>,
  ) {
    super();
  }

  getSystemPrompt(state: TripState): string {
    return `Eres Rafa, experto en planificación de viajes en Colombia.

PERSONALIDAD:
- Organizado y detallista
- Considera tiempos de traslado realistas
- Balancea actividades con descanso
- Sugiere alternativas para mal tiempo

CONTEXTO DEL VIAJE:
${this.formatStateForPrompt(state)}

SELECCIONES DEL USUARIO:
- Alojamiento: ${state.selectedLodging ? 'Seleccionado' : 'No definido'}
- Restaurante: ${state.selectedRestaurant ? 'Seleccionado' : 'No definido'}
- Experiencias: ${state.selectedExperiences.length} seleccionadas
- Guía: ${state.selectedGuide ? 'Seleccionado' : 'No definido'}

INSTRUCCIONES PARA ITINERARIOS:
1. Organiza por días (Día 1, Día 2, etc.)
2. Incluye horarios sugeridos (8:00 AM, 12:00 PM, etc.)
3. Considera tiempos de traslado entre actividades
4. Incluye comidas (desayuno, almuerzo, cena)
5. Deja tiempo libre para descanso
6. El último día debe tener tiempo para el regreso

EJEMPLO DE FORMATO:
**Día 1 - Llegada y exploración**
- 🕘 9:00 AM - Llegada y check-in en hotel
- 🕐 12:00 PM - Almuerzo en restaurante local
- 🕑 2:00 PM - Visita al centro histórico
- 🕕 6:00 PM - Tiempo libre
- 🕖 7:30 PM - Cena`;
  }

  async handle(context: ExpertContext): Promise<ExpertResponse> {
    const { message, state, history } = context;

    this.logger.debug('ItineraryExpert building itinerary');

    try {
      // Check if we have enough info
      if (!state.destination && !state.townId) {
        return {
          message: 'Para crear un itinerario necesito saber a dónde quieres ir. ¿Cuál es tu destino?',
          cards: [],
          stateUpdates: {},
          followUpQuestions: ['Quiero ir a San Rafael', 'Recomiéndame un destino'],
          suggestedActions: ['Ver destinos'],
          requiresMoreInfo: true,
        };
      }

      // Fetch selected entities
      const selections = await this.fetchSelections(state);

      // Generate itinerary
      const days = state.days || 3;
      const itinerary = await this.generateItinerary(state, selections, days);

      // Create day cards
      const dayCards = itinerary.map(day => this.createDayCard(day));

      // Generate response
      const response = await this.generateItineraryResponse(itinerary, state, message, history);

      return {
        message: response,
        cards: dayCards,
        stateUpdates: { currentGoal: 'Itinerario creado' },
        followUpQuestions: [
          '¿Ajustamos algún día?',
          '¿Calculamos el presupuesto total?',
        ],
        suggestedActions: ['Modificar itinerario', 'Ver presupuesto', 'Agregar experiencias'],
        requiresMoreInfo: false,
      };
    } catch (error) {
      this.logger.error(`ItineraryExpert error: ${error.message}`);
      return this.createErrorResponse(error.message);
    }
  }

  private async fetchSelections(state: TripState): Promise<{
    lodging: Lodging | null;
    restaurant: Restaurant | null;
    experiences: Experience[];
    places: Place[];
  }> {
    const lodging = state.selectedLodging
      ? await this.lodgingRepo.findOne({ where: { id: state.selectedLodging } })
      : null;

    const restaurant = state.selectedRestaurant
      ? await this.restaurantRepo.findOne({ where: { id: state.selectedRestaurant } })
      : null;

    const experiences: Experience[] = [];
    for (const expId of state.selectedExperiences) {
      const exp = await this.experienceRepo.findOne({ where: { id: expId } });
      if (exp) experiences.push(exp);
    }

    // Get some popular places if none selected
    const places = await this.placeRepo.find({
      where: state.townId
        ? { town: { id: state.townId }, isPublic: true }
        : { isPublic: true },
      take: 5,
      order: { rating: 'DESC' },
    });

    return { lodging, restaurant, experiences, places };
  }

  private async generateItinerary(
    state: TripState,
    selections: Awaited<ReturnType<typeof this.fetchSelections>>,
    numDays: number,
  ): Promise<DayPlan[]> {
    const days: DayPlan[] = [];
    const { lodging, restaurant, experiences, places } = selections;

    for (let i = 1; i <= numDays; i++) {
      const isFirstDay = i === 1;
      const isLastDay = i === numDays;
      const dayActivities: DayPlan['activities'] = [];

      if (isFirstDay) {
        // Day 1: Arrival
        dayActivities.push({
          time: '9:00 AM',
          activity: lodging ? `Check-in en ${lodging.name}` : 'Llegada y check-in en hotel',
          type: 'lodging',
          entityId: lodging?.id,
          duration: '1 hora',
        });
      } else {
        // Other days: Breakfast
        dayActivities.push({
          time: '8:00 AM',
          activity: 'Desayuno en el hotel',
          type: 'restaurant',
          duration: '1 hora',
        });
      }

      // Morning activity
      if (places.length > 0 && places[i - 1]) {
        const place = places[(i - 1) % places.length];
        dayActivities.push({
          time: isFirstDay ? '11:00 AM' : '9:30 AM',
          activity: `Visita a ${place.name}`,
          type: 'place',
          entityId: place.id,
          duration: '2 horas',
        });
      }

      // Lunch
      dayActivities.push({
        time: '12:30 PM',
        activity: restaurant ? `Almuerzo en ${restaurant.name}` : 'Almuerzo en restaurante local',
        type: 'restaurant',
        entityId: restaurant?.id,
        duration: '1.5 horas',
      });

      // Afternoon activity
      if (experiences.length > 0 && experiences[(i - 1) % experiences.length]) {
        const exp = experiences[(i - 1) % experiences.length];
        dayActivities.push({
          time: '2:30 PM',
          activity: exp.title,
          type: 'experience',
          entityId: exp.id,
          duration: '3 horas',
        });
      } else if (!isLastDay) {
        dayActivities.push({
          time: '2:30 PM',
          activity: 'Tiempo libre para explorar',
          type: 'free',
          duration: '3 horas',
        });
      }

      if (isLastDay) {
        // Last day: Checkout and return
        dayActivities.push({
          time: '3:00 PM',
          activity: 'Check-out y regreso',
          type: 'transport',
          notes: 'No olvides revisar el horario de tu transporte',
        });
      } else {
        // Other days: Dinner
        dayActivities.push({
          time: '7:00 PM',
          activity: 'Cena',
          type: 'restaurant',
          duration: '2 horas',
        });

        dayActivities.push({
          time: '9:00 PM',
          activity: 'Regreso al hotel / Tiempo libre',
          type: 'free',
        });
      }

      days.push({
        day: i,
        title: this.getDayTitle(i, isFirstDay, isLastDay, state.destination),
        activities: dayActivities,
      });
    }

    return days;
  }

  private getDayTitle(day: number, isFirst: boolean, isLast: boolean, destination?: string | null): string {
    if (isFirst) return `Llegada a ${destination || 'destino'}`;
    if (isLast) return 'Despedida y regreso';
    return `Explorando ${destination || 'el destino'}`;
  }

  private createDayCard(dayPlan: DayPlan): ChatCard {
    const emojiMap: Record<string, string> = {
      lodging: '🏨',
      restaurant: '🍽️',
      experience: '🎯',
      place: '📍',
      transport: '🚗',
      free: '✨',
    };

    return {
      id: `day-${dayPlan.day}`,
      type: 'entity_card',
      title: `Día ${dayPlan.day}`,
      subtitle: dayPlan.title,
      content: {
        activities: dayPlan.activities.map(a => ({
          time: a.time,
          emoji: emojiMap[a.type] || '📌',
          activity: a.activity,
          duration: a.duration,
          notes: a.notes,
          entityId: a.entityId,
        })),
      },
      actions: [
        { text: 'Modificar día', action: `modify_day_${dayPlan.day}` },
      ],
    };
  }

  private async generateItineraryResponse(
    itinerary: DayPlan[],
    state: TripState,
    userMessage: string,
    history: any[],
  ): Promise<string> {
    const itineraryContext = `
ITINERARIO GENERADO:
${itinerary.map(day => `
Día ${day.day}: ${day.title}
${day.activities.map(a => `- ${a.time}: ${a.activity}`).join('\n')}
`).join('\n')}
`;

    return this.llmService.generateExpertResponse(
      this.getSystemPrompt(state) + itineraryContext,
      userMessage,
      [],
      history,
    );
  }
}
