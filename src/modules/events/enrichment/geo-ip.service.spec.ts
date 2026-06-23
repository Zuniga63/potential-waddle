// UNSKIP in Plan 02 once GeoIpService/BotFilterService/EventsService exist.
//
// EVENT-03: geo is derived server-side from IP via MaxMind, coarse only
// (country/department/city), NEVER latitude/longitude, NEVER raw IP stored.
//
// This spec defines the contract Plan 02's GeoIpService must satisfy. It is
// describe.skip until the service + the `maxmind` dependency land in Plan 02.
// The module paths (`../enrichment/geo-ip.service`, `maxmind`) are required lazily
// INSIDE the skipped block so this file compiles before those modules exist.
describe.skip('GeoIpService (EVENT-03) — UNSKIP in Plan 02', () => {
  // Plan 02 setup will look like:
  //   jest.mock('maxmind');
  //   const maxmind = require('maxmind');
  //   const { GeoIpService } = require('../enrichment/geo-ip.service');
  let service: any;

  beforeEach(() => {
    jest.resetModules();
    // const { GeoIpService } = require('../enrichment/geo-ip.service');
    // service = new GeoIpService();
  });

  it('returns all-null geo for an undefined IP', () => {
    expect(service.lookup(undefined)).toEqual({ country: null, department: null, city: null });
  });

  it('returns all-null geo for a private/loopback IP (127.0.0.1)', () => {
    expect(service.lookup('127.0.0.1')).toEqual({ country: null, department: null, city: null });
  });

  it('maps a CityResponse to coarse country/department/city and NEVER lat/long', () => {
    // With the mocked Reader returning a CityResponse:
    //   { country:{names:{en:'Colombia'}}, subdivisions:[{names:{en:'Antioquia'}}], city:{names:{en:'Medellín'}}, location:{latitude:6.2,longitude:-75.5} }
    const result = service.lookup('1.2.3.4');
    expect(result).toEqual({ country: 'Colombia', department: 'Antioquia', city: 'Medellín' });
    expect(result).not.toHaveProperty('latitude');
    expect(result).not.toHaveProperty('longitude');
  });
});
