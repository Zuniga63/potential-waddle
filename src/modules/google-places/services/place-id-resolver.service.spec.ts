import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { PlaceIdResolverService } from './place-id-resolver.service';
import { Lodging } from 'src/modules/lodgings/entities/lodging.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { Commerce } from 'src/modules/commerce/entities/commerce.entity';

function makeLodging(overrides: Partial<Lodging> = {}): Lodging {
  return {
    id: 'entity-001',
    name: 'Test Lodging',
    googleMapsId: null,
    googleMapsUrl: null,
    town: {
      name: 'San Carlos',
      department: { name: 'Antioquia' } as any,
    } as any,
    ...overrides,
  } as Lodging;
}

describe('PlaceIdResolverService', () => {
  let service: PlaceIdResolverService;
  let httpService: { post: jest.Mock };
  let lodgingRepo: { findOne: jest.Mock; save: jest.Mock };
  let restaurantRepo: { findOne: jest.Mock; save: jest.Mock };
  let commerceRepo: { findOne: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    httpService = { post: jest.fn() };
    lodgingRepo = { findOne: jest.fn(), save: jest.fn().mockResolvedValue({}) };
    restaurantRepo = { findOne: jest.fn(), save: jest.fn().mockResolvedValue({}) };
    commerceRepo = { findOne: jest.fn(), save: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaceIdResolverService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-places-api-key') },
        },
        { provide: getRepositoryToken(Lodging), useValue: lodgingRepo },
        { provide: getRepositoryToken(Restaurant), useValue: restaurantRepo },
        { provide: getRepositoryToken(Commerce), useValue: commerceRepo },
      ],
    }).compile();

    service = module.get<PlaceIdResolverService>(PlaceIdResolverService);
  });

  it('returns cached googleMapsId without any Places API call', async () => {
    const entity = makeLodging({ googleMapsId: 'ChIJcached' });

    const result = await service.resolve(entity);

    expect(result).toBe('ChIJcached');
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('extracts place_id from URL when entity has googleMapsUrl but no googleMapsId', async () => {
    const entity = makeLodging({ googleMapsUrl: 'https://maps.google.com/place/test' });

    httpService.post.mockReturnValue(
      of({ data: { places: [{ id: 'ChIJFromUrl' }] } }),
    );

    const result = await service.resolve(entity, 'lodging');

    expect(result).toBe('ChIJFromUrl');
    expect(httpService.post).toHaveBeenCalledTimes(1);
    expect(lodgingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ googleMapsId: 'ChIJFromUrl' }));
  });

  it('builds query with real town + department names when no id/url, never hardcodes San Rafael', async () => {
    const entity = makeLodging({
      name: 'Hotel El Peñol',
      town: { name: 'Guatapé', department: { name: 'Antioquia' } } as any,
    });

    httpService.post.mockReturnValue(
      of({ data: { places: [{ id: 'ChIJFromText' }] } }),
    );

    const result = await service.resolve(entity);

    expect(result).toBe('ChIJFromText');

    const callArgs = httpService.post.mock.calls[0];
    const body = callArgs[1];
    expect(body.textQuery).toContain('Guatapé');
    expect(body.textQuery).toContain('Antioquia');
    expect(body.textQuery).not.toContain('San Rafael');
    expect(body.textQuery).not.toContain('San Rafael, Antioquia');
  });

  it('throws place_id_not_resolvable when entity has no id, url, or town/department', async () => {
    const entity = makeLodging({ town: null as any });

    await expect(service.resolve(entity)).rejects.toThrow('place_id_not_resolvable');
    expect(httpService.post).not.toHaveBeenCalled();
  });
});
