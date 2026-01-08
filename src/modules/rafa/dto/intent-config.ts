import { RafaIntent } from './rafa-intent.enum';
import { TripState } from './trip-state.dto';

export type ToolName =
  | 'searchLodgings'
  | 'searchRestaurants'
  | 'searchExperiences'
  | 'searchPlaces'
  | 'searchGuides'
  | 'searchTransport'
  | 'searchCommerce'
  | 'buildItinerary'
  | 'estimateBudget'
  | 'createLead'
  | 'selectEntity'
  | 'ragSearch';

export interface IntentConfig {
  requiredFields: (keyof TripState)[];
  requiredAnyOf?: (keyof TripState)[][];
  tool: ToolName | null;
  minConfidence: number;
  needsDestination?: boolean;
}

// Helper para validar days_or_dates
function hasDaysOrDates(state: TripState): boolean {
  return state.days !== null || (state.dateFrom !== null && state.dateTo !== null);
}

// Helper para validar contacto
function hasContact(state: TripState): boolean {
  return state.contactPhone !== null || state.contactEmail !== null;
}

export const INTENT_CONFIG: Record<RafaIntent, IntentConfig> = {
  // Búsquedas - no requieren campos obligatorios
  [RafaIntent.FIND_LODGING]: {
    requiredFields: [],
    tool: 'searchLodgings',
    minConfidence: 0.6,
  },
  [RafaIntent.FIND_RESTAURANT]: {
    requiredFields: [],
    tool: 'searchRestaurants',
    minConfidence: 0.6,
  },
  [RafaIntent.FIND_EXPERIENCE]: {
    requiredFields: [],
    tool: 'searchExperiences',
    minConfidence: 0.6,
  },
  [RafaIntent.FIND_PLACE]: {
    requiredFields: [],
    tool: 'searchPlaces',
    minConfidence: 0.6,
  },
  [RafaIntent.FIND_GUIDE]: {
    requiredFields: [],
    tool: 'searchGuides',
    minConfidence: 0.6,
  },
  [RafaIntent.FIND_TRANSPORT]: {
    requiredFields: [],
    tool: 'searchTransport',
    minConfidence: 0.6,
  },
  [RafaIntent.FIND_COMMERCE]: {
    requiredFields: [],
    tool: 'searchCommerce',
    minConfidence: 0.6,
  },

  // Acciones complejas - requieren más contexto
  [RafaIntent.BUILD_ITINERARY]: {
    requiredFields: ['destination'],
    // days OR (dateFrom AND dateTo) - se valida con helper
    tool: 'buildItinerary',
    minConfidence: 0.7,
    needsDestination: true,
  },
  [RafaIntent.ESTIMATE_BUDGET]: {
    requiredFields: ['destination'],
    tool: 'estimateBudget',
    minConfidence: 0.7,
    needsDestination: true,
  },

  // Leads - requieren entidad seleccionada y contacto
  [RafaIntent.CREATE_LEAD]: {
    requiredFields: [],
    requiredAnyOf: [['contactPhone', 'contactEmail']],
    tool: 'createLead',
    minConfidence: 0.7,
  },
  [RafaIntent.SELECT_ENTITY]: {
    requiredFields: [],
    tool: 'selectEntity',
    minConfidence: 0.6,
  },

  // Conversacionales - sin tool
  [RafaIntent.GREETING]: {
    requiredFields: [],
    tool: null,
    minConfidence: 0.8,
  },
  [RafaIntent.FAREWELL]: {
    requiredFields: [],
    tool: null,
    minConfidence: 0.8,
  },
  [RafaIntent.GENERAL_QUESTION]: {
    requiredFields: [],
    tool: 'ragSearch',
    minConfidence: 0.5,
  },

  // Fallback
  [RafaIntent.UNKNOWN]: {
    requiredFields: [],
    tool: null,
    minConfidence: 0,
  },
};

// Función para verificar si se cumplen los requisitos del intent
export function checkIntentRequirements(
  intent: RafaIntent,
  state: TripState,
): { canExecute: boolean; missingFields: string[] } {
  const config = INTENT_CONFIG[intent];
  const missingFields: string[] = [];

  // Verificar campos requeridos
  for (const field of config.requiredFields) {
    if (state[field] === null || state[field] === undefined) {
      missingFields.push(field);
    }
  }

  // Verificar requiredAnyOf (al menos uno de cada grupo)
  if (config.requiredAnyOf) {
    for (const group of config.requiredAnyOf) {
      const hasAny = group.some(field => state[field] !== null && state[field] !== undefined);
      if (!hasAny) {
        missingFields.push(`one of: ${group.join(', ')}`);
      }
    }
  }

  // Validación especial para BUILD_ITINERARY (days_or_dates)
  if (intent === RafaIntent.BUILD_ITINERARY && !hasDaysOrDates(state)) {
    missingFields.push('days or dates');
  }

  return {
    canExecute: missingFields.length === 0,
    missingFields,
  };
}
