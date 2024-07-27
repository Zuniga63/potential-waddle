import { MODELS } from './models';

export const FACILITIES: { id: string; name: string; slug: string; models: { id: string }[] }[] = [
  {
    id: '780e22fa-08cd-436e-9e42-1f39b2c16c78',
    name: 'Se permiten mascotas',
    slug: 'se-permiten-mascotas',
    models: [],
  },
  {
    id: 'ca53b0d9-02ad-4ffe-a456-137d5debf847',
    name: 'Cobertura movil (movistar)',
    slug: 'cobertura-movil-movista',
    models: [],
  },
  {
    id: '461143ec-480c-4552-b811-3ef3561636bd',
    name: 'Restaurantes',
    slug: 'restaurantes',
    models: [{ id: MODELS.places.id }],
  },
  {
    id: 'fca9856c-ca06-4d55-8809-2cde84fcc92f',
    name: 'Cobertura movil (Tigo)',
    slug: 'cobertura-movil-tigo',
    models: [],
  },
  {
    id: '18a06bdc-6be2-416e-824c-c5a8db31ae99',
    name: 'Cobertura movil (Claro)',
    slug: 'cobertura-movil-claro',
    models: [],
  },
  {
    id: 'dfaf9c0a-5694-496e-bd1e-960cdeb1e300',
    name: 'Zona de camping',
    slug: 'zona-de-camping',
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: 'da7bdc58-300b-463d-86d6-0cd51e7aa842',
    name: 'Area de picnic',
    slug: 'area-de-picnic',
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '4ac152a6-7051-4f9d-a347-20896619dd1c',
    name: 'Baños publicos',
    slug: 'baños-publicos',
    models: [],
  },
  {
    id: '73510724-8929-41ea-ab0c-ab65b4bd59df',
    name: 'Tiendas',
    slug: 'tiendas',
    models: [{ id: MODELS.places.id }, { id: MODELS.experiences.id }],
  },
  {
    id: '3916fba9-bb31-49ff-a493-30c8856383c7',
    name: 'Parqueadero',
    slug: 'parqueadero',
    models: [],
  },
  {
    id: '9591f19b-dd5c-4805-ab2e-4782ca88dc57',
    name: 'Cobertura movil (WON)',
    slug: 'cobertura-movil-won',
    models: [],
  },
];
