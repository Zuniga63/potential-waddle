import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { PlaceIdResolverService, isPlacesGeneratedUrl, placeKeyFromMapsUrl } from './place-id-resolver.service';
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

describe('isPlacesGeneratedUrl', () => {
  it('accepts the cid format Google returns (the onboarding default)', () => {
    expect(
      isPlacesGeneratedUrl('https://maps.google.com/?cid=10903639648050278547&g_mp=Cidn'),
    ).toBe(true);
  });

  it('accepts the place_id: fallback the picker builds', () => {
    expect(
      isPlacesGeneratedUrl('https://www.google.com/maps/place/?q=place_id:ChIJn2pn7csGRI4Rk_DmbH2CUZc'),
    ).toBe(true);
  });

  it('accepts a /maps/place path', () => {
    expect(isPlacesGeneratedUrl('https://www.google.com/maps/place/Hotel/@6.2,-75.0,17z')).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty', ''],
    ['not a url', 'pegué cualquier cosa'],
    ['non-google host', 'https://booking.com/hotel-xyz'],
    ['google but not maps', 'https://www.google.com/search?q=hotel'],
    ['maps host without place identifier', 'https://maps.google.com/?foo=bar'],
    ['non-numeric cid', 'https://maps.google.com/?cid=abc'],
    ['http (not https)', 'http://maps.google.com/?cid=123'],
  ])('rejects %s', (_label, url) => {
    expect(isPlacesGeneratedUrl(url as any)).toBe(false);
  });
});

describe('placeKeyFromMapsUrl', () => {
  it('extracts the cid as a stable key, ignoring the volatile g_mp param', () => {
    const a = placeKeyFromMapsUrl('https://maps.google.com/?cid=11157536531558590571&g_mp=AAAAAA');
    const b = placeKeyFromMapsUrl('https://maps.google.com/?cid=11157536531558590571&g_mp=ZZZZZZ');
    expect(a).toBe('cid:11157536531558590571');
    // Same place, different tracking noise → same key (no false "changed")
    expect(a).toBe(b);
  });

  it('extracts the place_id token', () => {
    expect(placeKeyFromMapsUrl('https://www.google.com/maps/place/?q=place_id:ChIJabc-123')).toBe(
      'place_id:ChIJabc-123',
    );
  });

  it('returns different keys for different places (real change is detected)', () => {
    expect(placeKeyFromMapsUrl('https://maps.google.com/?cid=111')).not.toBe(
      placeKeyFromMapsUrl('https://maps.google.com/?cid=222'),
    );
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty', ''],
    ['no place identifier', 'https://maps.google.com/?foo=bar'],
    ['non-numeric cid', 'https://maps.google.com/?cid=abc'],
    ['unparseable', 'pegué cualquier cosa'],
  ])('returns null for %s (not comparable → never wipes)', (_label, url) => {
    expect(placeKeyFromMapsUrl(url as any)).toBeNull();
  });
});
