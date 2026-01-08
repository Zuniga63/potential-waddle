export enum RafaIntent {
  // Búsquedas
  FIND_LODGING = 'find_lodging',
  FIND_RESTAURANT = 'find_restaurant',
  FIND_EXPERIENCE = 'find_experience',
  FIND_PLACE = 'find_place',
  FIND_GUIDE = 'find_guide',
  FIND_TRANSPORT = 'find_transport',
  FIND_COMMERCE = 'find_commerce',

  // Acciones complejas
  BUILD_ITINERARY = 'build_itinerary',
  ESTIMATE_BUDGET = 'estimate_budget',

  // Leads
  CREATE_LEAD = 'create_lead',
  SELECT_ENTITY = 'select_entity',

  // Conversacionales
  GREETING = 'greeting',
  FAREWELL = 'farewell',
  GENERAL_QUESTION = 'general_question',

  // Fallback
  UNKNOWN = 'unknown',
}

export const TRIP_STYLES = ['aventura', 'relax', 'romantico', 'familiar', 'cultural', 'naturaleza', 'gastronomico'] as const;
export type TripStyle = (typeof TRIP_STYLES)[number];
