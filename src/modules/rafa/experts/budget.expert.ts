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

/**
 * Budget breakdown structure
 */
interface BudgetBreakdown {
  lodging: {
    name: string | null;
    perNight: number;
    nights: number;
    total: number;
  };
  food: {
    perDay: number;
    days: number;
    total: number;
  };
  transport: {
    toDestination: number;
    local: number;
    total: number;
  };
  experiences: {
    items: { name: string; price: number }[];
    total: number;
  };
  extras: {
    perDay: number;
    total: number;
  };
  grandTotal: number;
  perPerson: number;
  currency: string;
}

/**
 * Budget Expert - Calculates trip costs and budgets
 *
 * Specializes in:
 * - Calculating total trip costs
 * - Breaking down costs by category
 * - Comparing budget vs actual selections
 * - Suggesting ways to save money
 */
@Injectable()
export class BudgetExpert extends BaseExpert {
  private readonly logger = new Logger(BudgetExpert.name);

  readonly name = 'Experto en Presupuestos';
  readonly description = 'Calcula costos de viaje, presupuestos y da recomendaciones de ahorro';

  readonly handledIntents = [RafaIntent.ESTIMATE_BUDGET];

  constructor(
    private readonly llmService: LlmService,
    @InjectRepository(Lodging) private lodgingRepo: Repository<Lodging>,
    @InjectRepository(Restaurant) private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(Experience) private experienceRepo: Repository<Experience>,
  ) {
    super();
  }

  getSystemPrompt(state: TripState): string {
    return `Eres Rafa, experto en presupuestos de viaje en Colombia.

PERSONALIDAD:
- Práctico y claro con los números
- Das rangos realistas (económico, medio, premium)
- Sugieres formas de ahorrar sin perder calidad
- Usas COP (pesos colombianos)

CONTEXTO DEL VIAJE:
${this.formatStateForPrompt(state)}

PRECIOS DE REFERENCIA EN COLOMBIA:
- Hostal: $40,000 - $80,000/noche
- Hotel medio: $100,000 - $200,000/noche
- Hotel premium: $250,000 - $500,000/noche
- Comida económica: $15,000 - $25,000/plato
- Comida media: $30,000 - $50,000/plato
- Comida premium: $60,000 - $120,000/plato
- Transporte local: $20,000 - $50,000/día
- Experiencia promedio: $50,000 - $150,000/persona

INSTRUCCIONES:
1. Presenta el desglose de forma clara y organizada
2. Muestra subtotales por categoría
3. Da el total general y por persona
4. Sugiere alternativas si el presupuesto es ajustado
5. Destaca dónde se puede ahorrar`;
  }

  async handle(context: ExpertContext): Promise<ExpertResponse> {
    const { message, state, history } = context;

    this.logger.debug('BudgetExpert calculating costs');

    try {
      // Calculate detailed budget breakdown
      const budget = await this.calculateBudget(state);

      // Create budget card
      const budgetCard = this.createBudgetCard(budget, state);

      // Generate natural language response
      const response = await this.generateBudgetResponse(budget, state, message, history);

      return {
        message: response,
        cards: [budgetCard],
        stateUpdates: { currentGoal: 'Presupuesto calculado' },
        followUpQuestions: this.generateFollowUps(budget, state),
        suggestedActions: ['Ajustar presupuesto', 'Ver opciones más baratas', 'Crear itinerario'],
        requiresMoreInfo: false,
      };
    } catch (error) {
      this.logger.error(`BudgetExpert error: ${error.message}`);
      return this.createErrorResponse(error.message);
    }
  }

  private async calculateBudget(state: TripState): Promise<BudgetBreakdown> {
    const days = state.days || 3;
    const nights = Math.max(1, days - 1);
    const people = state.partySize || 2;

    // Lodging
    let lodgingPerNight = 150000; // Default mid-range
    let lodgingName: string | null = null;
    if (state.selectedLodging) {
      const lodging = await this.lodgingRepo.findOne({ where: { id: state.selectedLodging } });
      if (lodging) {
        lodgingPerNight = lodging.lowestPrice || lodgingPerNight;
        lodgingName = lodging.name;
      }
    }
    const lodgingTotal = lodgingPerNight * nights;

    // Food - estimate based on 3 meals per day
    const foodPerDay = 80000 * people; // ~$27k breakfast, $27k lunch, $27k dinner per person
    const foodTotal = foodPerDay * days;

    // Transport
    const transportToDestination = 50000 * people; // Bus/shared transport
    const transportLocal = 30000 * days; // Local transport per day
    const transportTotal = transportToDestination + transportLocal;

    // Experiences
    const experienceItems: { name: string; price: number }[] = [];
    let experiencesTotal = 0;

    if (state.selectedExperiences.length > 0) {
      for (const expId of state.selectedExperiences) {
        const exp = await this.experienceRepo.findOne({ where: { id: expId } });
        if (exp) {
          const price = (exp.price || 80000) * people;
          experienceItems.push({ name: exp.title, price });
          experiencesTotal += price;
        }
      }
    } else {
      // Estimate 1 experience per day
      experiencesTotal = 80000 * people * Math.min(days, 3);
      experienceItems.push({ name: 'Experiencias estimadas', price: experiencesTotal });
    }

    // Extras (souvenirs, tips, misc)
    const extrasPerDay = 30000 * people;
    const extrasTotal = extrasPerDay * days;

    // Grand total
    const grandTotal = lodgingTotal + foodTotal + transportTotal + experiencesTotal + extrasTotal;

    return {
      lodging: {
        name: lodgingName,
        perNight: lodgingPerNight,
        nights,
        total: lodgingTotal,
      },
      food: {
        perDay: foodPerDay,
        days,
        total: foodTotal,
      },
      transport: {
        toDestination: transportToDestination,
        local: transportLocal,
        total: transportTotal,
      },
      experiences: {
        items: experienceItems,
        total: experiencesTotal,
      },
      extras: {
        perDay: extrasPerDay,
        total: extrasTotal,
      },
      grandTotal,
      perPerson: Math.round(grandTotal / people),
      currency: state.budgetCurrency || 'COP',
    };
  }

  private createBudgetCard(budget: BudgetBreakdown, state: TripState): ChatCard {
    const formatPrice = (price: number) => `$${price.toLocaleString('es-CO')}`;

    return {
      id: 'budget-breakdown',
      type: 'entity_card',
      title: `Presupuesto: ${state.destination || 'Tu viaje'}`,
      subtitle: `${state.days || 3} días, ${state.partySize || 2} personas`,
      content: {
        breakdown: [
          {
            category: '🏨 Alojamiento',
            detail: budget.lodging.name || 'Hotel promedio',
            amount: formatPrice(budget.lodging.total),
            perUnit: `${formatPrice(budget.lodging.perNight)}/noche × ${budget.lodging.nights}`,
          },
          {
            category: '🍽️ Alimentación',
            detail: '3 comidas/día',
            amount: formatPrice(budget.food.total),
            perUnit: `${formatPrice(budget.food.perDay)}/día × ${budget.food.days}`,
          },
          {
            category: '🚗 Transporte',
            detail: 'Ida/vuelta + local',
            amount: formatPrice(budget.transport.total),
          },
          {
            category: '🎯 Experiencias',
            detail: `${budget.experiences.items.length} actividades`,
            amount: formatPrice(budget.experiences.total),
          },
          {
            category: '🛍️ Extras',
            detail: 'Souvenirs, propinas',
            amount: formatPrice(budget.extras.total),
          },
        ],
        total: formatPrice(budget.grandTotal),
        perPerson: formatPrice(budget.perPerson),
        currency: budget.currency,
      },
      actions: [
        { text: 'Ver opciones más baratas', action: 'search_cheaper' },
        { text: 'Crear itinerario', action: 'build_itinerary' },
      ],
    };
  }

  private async generateBudgetResponse(
    budget: BudgetBreakdown,
    state: TripState,
    userMessage: string,
    history: any[],
  ): Promise<string> {
    const formatPrice = (price: number) => `$${price.toLocaleString('es-CO')}`;

    const budgetContext = `
PRESUPUESTO CALCULADO:
- Alojamiento: ${formatPrice(budget.lodging.total)} (${budget.lodging.nights} noches)
- Alimentación: ${formatPrice(budget.food.total)} (${budget.food.days} días)
- Transporte: ${formatPrice(budget.transport.total)}
- Experiencias: ${formatPrice(budget.experiences.total)}
- Extras: ${formatPrice(budget.extras.total)}
- TOTAL: ${formatPrice(budget.grandTotal)}
- Por persona: ${formatPrice(budget.perPerson)}
`;

    return this.llmService.generateExpertResponse(
      this.getSystemPrompt(state) + budgetContext,
      userMessage,
      [],
      history,
    );
  }

  private generateFollowUps(budget: BudgetBreakdown, state: TripState): string[] {
    const followUps: string[] = [];

    // Check if over budget
    if (state.budgetMax && budget.grandTotal > state.budgetMax) {
      followUps.push('¿Quieres ver opciones más económicas?');
    }

    if (!state.selectedLodging) {
      followUps.push('¿Buscamos un hotel dentro del presupuesto?');
    }

    if (state.selectedExperiences.length === 0) {
      followUps.push('¿Agregamos algunas experiencias?');
    }

    if (followUps.length === 0) {
      followUps.push('¿Creamos el itinerario completo?');
      followUps.push('¿Ajustamos algo del presupuesto?');
    }

    return followUps.slice(0, 2);
  }
}
