import { MODELS } from './models';

interface Category {
  id: string;
  name: string;
  slug: string;
  isEnabled?: boolean;
  models: { id: string }[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'a279d491-7468-472e-9bfd-24dabebbb0ee',
    name: 'Charco',
    slug: 'charco',
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
    isEnabled: true,
  },
  {
    id: '323de9a7-adde-4fb0-8ba7-de0081ccce0f',
    name: 'Balneario',
    slug: 'balneario',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'e721d20d-76a0-4b50-8d4d-7b439ad7b4aa',
    name: 'Cascada',
    slug: 'cascada',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'ff3bb7c8-c060-4c6d-8f7c-7d5b94b350a4',
    name: 'Río',
    slug: 'rio',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '2e17828c-9df9-4aaf-966b-669a13ba85ab',
    name: 'Playa',
    slug: 'playa',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '515a0dfa-540e-4888-87a6-84c0ee2f8a5e',
    name: 'Lago',
    slug: 'lago',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '777003b2-8543-471c-bb0c-f52339f914e7',
    name: 'Parque Natural',
    slug: 'parque-natural',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '6ce931c2-9a62-4d50-a079-a6ce2f9b99e3',
    name: 'Reserva Forestal',
    slug: 'reserva-forestal',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '74cef782-0a89-410e-b04e-e82bb9a08eda',
    name: 'Iglesia',
    slug: 'iglesia',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '3aa26dfa-0a86-4eeb-92b5-d89a888e484c',
    name: 'Museo',
    slug: 'museo',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'be614fc2-5e73-409d-b475-c2a068c16381',
    name: 'Monumento Histórico',
    slug: 'monumento-historico',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '5cea666a-6493-4e5a-8b61-dfabedf141bc',
    name: 'Sitio Arqueológico',
    slug: 'sitio-arqueologico',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'a11bff45-f9fc-4679-8613-e873cd2df69f',
    name: 'Parque Temático',
    slug: 'parque-tematico',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'b23c0772-df85-4b67-8de3-b8f7ffd5edde',
    name: 'Zoológico',
    slug: 'zoologico',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '24ea0ff2-40d8-4a2e-8bb8-67c0e0f59f6e',
    name: 'Jardín Botánico',
    slug: 'jardin-botanico',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'b68d6354-ee5b-4268-b428-a8e0b3f5e32c',
    name: 'Acuario',
    slug: 'acuario',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '5ad75c07-8855-4438-a9e5-afea2acb826d',
    name: 'Centro de Entretenimiento',
    slug: 'centro-de-entretenimiento',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'ed173abd-cda4-4125-8e9b-5fe1f6f4ad51',
    name: 'Festival',
    slug: 'festival',
    isEnabled: false,
    models: [{ id: MODELS.experiences.id }],
  },
  {
    id: '076a94f8-63c2-492f-be6b-56622cf19632',
    name: 'Feria',
    slug: 'feria',
    isEnabled: false,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '27d36614-8147-41d6-bec9-b8c808e35a2e',
    name: 'Mercado Artesanal',
    slug: 'mercado-artesanal',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '9ef3dd2d-0cc9-4861-8f5b-219b0da723ae',
    name: 'Senderismo',
    slug: 'senderismo',
    isEnabled: true,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '3a2f7eb7-b231-44e2-92ce-ac58f99577e1',
    name: 'Escalada',
    slug: 'escalada',
    isEnabled: true,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'bc5b0a1c-b0b0-44b8-9d61-0f9bcf596dac',
    name: 'Deportes Acuáticos',
    slug: 'deportes-acuaticos',
    isEnabled: true,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'fcf05cda-f895-4fc4-8640-75c4b3b0ba9f',
    name: 'Rutas de Bicicleta',
    slug: 'rutas-de-bicicleta',
    isEnabled: true,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '19c5f7b5-260c-4784-8abb-a5e390c45691',
    name: 'Ecoturismo',
    slug: 'ecoturismo',
    isEnabled: true,
    models: [{ id: MODELS.places.id }],
  },
];
