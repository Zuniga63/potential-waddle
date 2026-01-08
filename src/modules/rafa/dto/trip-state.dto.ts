import { z } from 'zod';
import { TRIP_STYLES } from './rafa-intent.enum';

// Schema para resultados de búsqueda en memoria
const LastResultSchema = z.object({
  entityType: z.enum(['lodging', 'restaurant', 'experience', 'place', 'guide', 'transport', 'commerce']),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      position: z.number().int().min(1),
    }),
  ),
});

// Schema principal del estado del viaje
export const TripStateSchema = z.object({
  // Destino
  destination: z.string().nullable().default(null),
  townId: z.string().uuid().nullable().default(null),

  // Grupo
  partySize: z.number().int().min(1).max(50).nullable().default(null),

  // Fechas - usando coerce para parsear strings automáticamente
  dateFrom: z.coerce.date().nullable().default(null),
  dateTo: z.coerce.date().nullable().default(null),
  days: z.number().int().min(1).max(30).nullable().default(null),

  // Presupuesto
  budgetMin: z.number().min(0).nullable().default(null),
  budgetMax: z.number().min(0).nullable().default(null),
  budgetCurrency: z.enum(['COP', 'USD']).default('COP'),

  // Preferencias
  tripStyle: z.array(z.enum(TRIP_STYLES)).default([]),
  tags: z.array(z.string()).default([]),

  // Selecciones del usuario
  selectedLodging: z.string().uuid().nullable().default(null),
  selectedRestaurant: z.string().uuid().nullable().default(null),
  selectedExperiences: z.array(z.string().uuid()).default([]),
  selectedGuide: z.string().uuid().nullable().default(null),
  selectedTransport: z.string().uuid().nullable().default(null),

  // Contexto de la conversación
  lastResults: LastResultSchema.nullable().default(null),
  currentGoal: z.string().nullable().default(null),

  // Contacto para leads
  contactPhone: z.string().nullable().default(null),
  contactEmail: z.string().email().nullable().default(null),
});

export type TripState = z.infer<typeof TripStateSchema>;

// Estado inicial vacío
export const EMPTY_TRIP_STATE: TripState = TripStateSchema.parse({});

// Helper para crear estado con valores parciales
export function createTripState(partial: Partial<TripState> = {}): TripState {
  return TripStateSchema.parse(partial);
}

// Helper para mergear estados
export function mergeTripState(current: TripState, updates: Partial<TripState>): TripState {
  return TripStateSchema.parse({ ...current, ...updates });
}
