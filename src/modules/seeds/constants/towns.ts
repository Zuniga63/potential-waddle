import { Point } from 'typeorm';

export const DEPARTMENTS = {
  antioquia: { id: 'b0a3595e-d0f7-4c3b-888f-4b2448f6cd07', name: 'Antioquia', capital: 'Medellín' },
};

export const TOWNS = [
  {
    id: 'ca535a35-0d64-4c22-9b3a-a874e4ba34f8',
    department: { id: DEPARTMENTS.antioquia.id },
    name: 'San Rafael',
    description:
      'San Rafael es un municipio de Colombia, ubicado sobre la cordillera andina central y localizado en la subregión Oriente del departamento de Antioquia. Limita por el norte con los municipios de Alejandría y San Roque, por el este y el sur con el municipio de San Carlos y por el oeste con los municipios de Guatapé y Alejandría.',
    location: { type: 'Point', coordinates: [-75.0388768, 6.2935444] } as Point,
  },
  {
    id: '29a56207-8924-4122-aee3-88c273e72d14',
    department: { id: DEPARTMENTS.antioquia.id },
    name: 'San Carlos',
    description:
      'Es un municipio de Colombia, localizado en la subregión Oriente del departamento de Antioquia. Limita por el norte con los municipios de San Rafael, San Roque y Caracolí, por el este con el municipio de Puerto Nare, por el sur con los municipios de Puerto Nare y San Luis y por el oeste con los municipios de Granada y Guatapé.',
    location: { type: 'Point', coordinates: [-74.992222, 6.187222] } as Point,
  },
];
