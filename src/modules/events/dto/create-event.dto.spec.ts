import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEventDto, EventType } from './create-event.dto';
import { sanitizeProperties } from '../constants/event-properties-allowlist';

// EVENT-07: the DTO is the first trust gate for the public ingest endpoint.
// These specs test code that EXISTS now and MUST pass green.
describe('CreateEventDto (EVENT-07)', () => {
  describe('event_type validation', () => {
    it('accepts a payload with a valid event_type', async () => {
      const dto = plainToInstance(CreateEventDto, { eventType: EventType.PAGE_VIEW });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects an unknown event_type (dashboard pollution guard)', async () => {
      const dto = plainToInstance(CreateEventDto, { eventType: 'totally_made_up' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('eventType');
    });
  });

  describe('client geo/town stripping (D-06/D-07/T-15-01/T-15-02)', () => {
    it('strips client-supplied latitude/country/town_id via whitelist ValidationPipe', async () => {
      const pipe = new ValidationPipe({ whitelist: true, transform: true });
      const payload = {
        eventType: EventType.PAGE_VIEW,
        latitude: 4.6097,
        longitude: -74.0817,
        country: 'Colombia',
        city: 'Bogotá',
        town_id: 'malicious-town',
        userId: 'someone',
      };

      const result = (await pipe.transform(payload, {
        type: 'body',
        metatype: CreateEventDto,
      })) as Record<string, unknown>;

      expect(result).not.toHaveProperty('latitude');
      expect(result).not.toHaveProperty('longitude');
      expect(result).not.toHaveProperty('country');
      expect(result).not.toHaveProperty('city');
      expect(result).not.toHaveProperty('town_id');
      expect(result).not.toHaveProperty('userId');
      expect(result.eventType).toBe(EventType.PAGE_VIEW);
    });
  });
});

// EVENT-07: properties allowlist sanitizer (pure function, no mocks).
describe('sanitizeProperties (EVENT-07)', () => {
  it('keeps only allowlisted keys and drops PII for search_performed', () => {
    const result = sanitizeProperties('search_performed', {
      query: 'cabañas',
      result_count: 3,
      email: 'a@b.com',
    });
    expect(result).toEqual({ query: 'cabañas', result_count: 3 });
    expect(result).not.toHaveProperty('email');
  });

  it('returns null when properties is empty or null', () => {
    expect(sanitizeProperties('search_performed', {})).toBeNull();
    expect(sanitizeProperties('search_performed', null)).toBeNull();
    expect(sanitizeProperties('search_performed', undefined)).toBeNull();
  });

  it('returns null when no allowlisted keys remain after filtering', () => {
    expect(sanitizeProperties('search_performed', { email: 'a@b.com' })).toBeNull();
  });

  it('returns null for an unknown event_type', () => {
    expect(sanitizeProperties('not_a_real_type', { query: 'x' })).toBeNull();
  });

  it('returns null when the serialized object exceeds 4096 chars (DoS guard T-15-08)', () => {
    const huge = 'x'.repeat(5000);
    const result = sanitizeProperties('search_performed', { query: huge, result_count: 1 });
    expect(result).toBeNull();
  });
});
