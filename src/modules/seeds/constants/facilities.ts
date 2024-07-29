import { MODELS } from './models';

interface Facility {
  id: string;
  name: string;
  slug: string;
  models: { id: string }[];
  isEnabled?: boolean;
}

export const FACILITIES: Facility[] = [
  {
    id: '780e22fa-08cd-436e-9e42-1f39b2c16c78',
    name: 'Se permiten mascotas',
    slug: 'se-permiten-mascotas',
    isEnabled: true,
    models: [],
  },
  {
    id: 'ca53b0d9-02ad-4ffe-a456-137d5debf847',
    name: 'Cobertura móvil (Movistar)',
    slug: 'cobertura-movil-movistar',
    isEnabled: true,
    models: [],
  },
  {
    id: '461143ec-480c-4552-b811-3ef3561636bd',
    name: 'Restaurantes',
    slug: 'restaurantes',
    isEnabled: true,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'fca9856c-ca06-4d55-8809-2cde84fcc92f',
    name: 'Cobertura móvil (Tigo)',
    slug: 'cobertura-movil-tigo',
    isEnabled: true,
    models: [],
  },
  {
    id: '18a06bdc-6be2-416e-824c-c5a8db31ae99',
    name: 'Cobertura móvil (Claro)',
    slug: 'cobertura-movil-claro',
    isEnabled: true,
    models: [],
  },
  {
    id: 'dfaf9c0a-5694-496e-bd1e-960cdeb1e300',
    name: 'Zona de camping',
    slug: 'zona-de-camping',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'da7bdc58-300b-463d-86d6-0cd51e7aa842',
    name: 'Áreas de picnic',
    slug: 'area-de-picnic',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '4ac152a6-7051-4f9d-a347-20896619dd1c',
    name: 'Baños públicos',
    slug: 'baños-publicos',
    isEnabled: true,
    models: [],
  },
  {
    id: '73510724-8929-41ea-ab0c-ab65b4bd59df',
    name: 'Tiendas',
    slug: 'tiendas',
    isEnabled: true,
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '3916fba9-bb31-49ff-a493-30c8856383c7',
    name: 'Parqueadero',
    slug: 'parqueadero',
    isEnabled: true,
    models: [],
  },
  {
    id: '9591f19b-dd5c-4805-ab2e-4782ca88dc57',
    name: 'Cobertura movil (WON)',
    slug: 'cobertura-movil-won',
    isEnabled: true,
    models: [],
  },
  {
    id: 'f45b2aca-a375-4bbf-93c9-732d7a27f36c',
    name: 'Senderos para caminar',
    slug: 'senderos-para-caminar',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'ae722ebf-45e5-4bf0-923b-5452275d6330',
    name: 'Zonas de juegos infantiles',
    slug: 'zonas-de-juegos-infantiles',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '63b8266f-29c5-4392-9a94-4d4c837e34c3',
    name: 'Areas de descanso',
    slug: 'areas-de-descanso',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '86b3e329-1d5b-41bc-b230-46d328952f23',
    name: 'Puntos de informacion',
    slug: 'puntos-de-informacion',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '3d2bc470-1881-488e-bbcf-89767bf59e95',
    name: 'Zonas para hacer ejercicio',
    slug: 'zonas-para-hacer-ejercicio',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'e6b3d75a-1610-44d4-a08c-a9f915a194ee',
    name: 'Miradores',
    slug: 'miradores',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'e66d1601-7964-4a3b-a849-0e22b3ba4654',
    name: 'Cafeterías',
    slug: 'cafeterias',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '4fb23061-b1eb-43ba-a95c-a528c89d2537',
    name: 'Kioskos de comida rapida',
    slug: 'kioskos-de-comida-rapida',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '16c4d77f-27c7-4407-8070-7d687da296bf',
    name: 'Areas de barbacoa',
    slug: 'areas-de-barbacoa',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '573971e7-d0ba-4136-ab0a-5b7d53acd8a3',
    name: 'Fuente de agua potable',
    slug: 'fuente-de-agua-potable',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '893d9fdf-25ad-4574-85b6-fa850af04448',
    name: 'Zona de picnic con mesas',
    slug: 'zona-de-picnic-con-mesas',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '217d8a84-8690-4100-a4dd-43392f868f76',
    name: 'Parques para perros',
    slug: 'parques-para-perros',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '06f3951c-95ad-4d11-a6dd-5baa6ce445e8',
    name: 'Espacio para eventos y conciertos',
    slug: 'espacio-para-eventos-y-conciertos',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '84e5ae0a-b233-4e9e-b769-b8b2ea46922e',
    name: 'Instalaciones deportivas',
    slug: 'instalaciones-deportivas',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '76bd728d-fe98-4123-965a-dbe964055b77',
    name: 'Vestuarios y duchas',
    slug: 'vestuarios-y-duchas',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '5668b74d-621e-4e1f-b0d2-f62585ab3b27',
    name: 'Taquillas de seguridad',
    slug: 'taquillas-de-seguridad',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '5d126585-5660-402b-9900-324cb452702f',
    name: 'Primeros auxilios',
    slug: 'primeros-auxilios',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '54b8bdaa-7138-4bcf-8856-7a08d59c4dc5',
    name: 'Espacio de arte y escultura',
    slug: 'espacio-de-arte-y-escultura',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'fbe243b0-a223-47f6-bc6a-4c60f86c8d44',
    name: 'Areas de observación de la naturaleza',
    slug: 'areas-de-observacion-de-la-naturaleza',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '10a0e575-bb52-4511-81bb-0b2829d82d70',
    name: 'Areas de meditación o yoga',
    slug: 'areas-de-meditacion-o-yoga',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
  {
    id: '58f44375-27fb-45ea-bfd8-fafad7eee26c',
    name: 'Seguridad',
    slug: 'seguridad',
    isEnabled: false,
    models: [{ id: MODELS.places.id }],
  },
];
