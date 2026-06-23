// EVENT-03: geo is derived server-side from IP via MaxMind, coarse only
// (country/department/city), NEVER latitude/longitude, NEVER raw IP stored.
//
// The maxmind module is mocked so the spec runs without a real .mmdb on disk:
// validate() is real-ish (true for public IPs, false for loopback), and the
// injected Reader returns a CityResponse for the one public test IP.
import { GeoIpService } from './geo-ip.service';
import maxmind from 'maxmind';

jest.mock('maxmind', () => ({
  __esModule: true,
  default: {
    validate: jest.fn((ip: string) => ip !== '127.0.0.1'),
  },
}));

describe('GeoIpService (EVENT-03)', () => {
  let service: GeoIpService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeoIpService();
    // Inject a fake Reader directly (onModuleInit would open a real file).
    (service as any).reader = {
      get: (ip: string) =>
        ip === '1.2.3.4'
          ? {
              country: { names: { en: 'Colombia' } },
              subdivisions: [{ names: { en: 'Antioquia' } }],
              city: { names: { en: 'Medellín' } },
              location: { latitude: 6.2, longitude: -75.5 },
            }
          : null,
    };
  });

  it('returns all-null geo for an undefined IP', () => {
    expect(service.lookup(undefined)).toEqual({ country: null, department: null, city: null });
  });

  it('returns all-null geo for a private/loopback IP (127.0.0.1)', () => {
    expect(service.lookup('127.0.0.1')).toEqual({ country: null, department: null, city: null });
    expect(maxmind.validate).toHaveBeenCalledWith('127.0.0.1');
  });

  it('returns all-null geo when the reader is not loaded (DB missing)', () => {
    (service as any).reader = null;
    expect(service.lookup('1.2.3.4')).toEqual({ country: null, department: null, city: null });
  });

  it('maps a CityResponse to coarse country/department/city and NEVER lat/long', () => {
    const result = service.lookup('1.2.3.4');
    expect(result).toEqual({ country: 'Colombia', department: 'Antioquia', city: 'Medellín' });
    expect(result).not.toHaveProperty('latitude');
    expect(result).not.toHaveProperty('longitude');
  });
});
