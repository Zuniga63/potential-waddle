import { computeLodgingCompletion } from './compute-lodging-completion';
import { Lodging } from '../entities';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildLodging(overrides: Partial<Lodging> = {}): Lodging {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Lodging',
    slug: 'test-lodging',
    description: null,
    status: 'draft',
    submittedAt: null,
    rejectionReason: null,
    isPublic: false,
    stateDB: true,
    points: 0,
    reviewCount: 0,
    rating: 0,
    roomTypes: [],
    amenities: [],
    roomCount: 0,
    lowestPrice: null,
    highestPrice: null,
    priceUnit: 'noche',
    address: null,
    phoneNumbers: [],
    email: null,
    website: null,
    facebook: null,
    instagram: null,
    whatsappNumbers: [],
    openingHours: null,
    spokenLanguages: [],
    capacity: null,
    location: null as any,
    googleMapsUrl: null,
    urbanCenterDistance: null,
    howToGetThere: null,
    arrivalReference: null,
    paymentMethods: null,
    googleMapsRating: null,
    googleMapsId: null,
    googleMapsReviewsCount: null,
    showGoogleMapsReviews: true,
    showBinntuReviews: true,
    googleMapsName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Relations default to empty
    town: null as any,
    categories: [],
    images: [],
    facilities: [],
    user: null as any,
    reviews: [],
    places: [],
    lodgingRoomTypes: [],
    ...overrides,
  } as Lodging;
}

function buildFullLodging(): Lodging {
  return buildLodging({
    name: 'Full Lodging',
    description: 'A'.repeat(60), // >= 50 chars
    town: { id: 'town-uuid-1' } as any,
    address: '123 Main Street',
    categories: [{ id: 'cat-1', name: 'Hostal' } as any],
    whatsappNumbers: ['+573001234567'],
    email: 'contact@lodge.com',
    phoneNumbers: ['+573009876543'],
    lowestPrice: 50000 as any,
    highestPrice: 100000 as any,
    lodgingRoomTypes: [
      {
        id: 'rt-1',
        name: 'Standard Room',
        price: 50000 as any,
        maxCapacity: 2,
      } as any,
    ],
    images: [
      { id: 'img-1', imageResource: { id: 'res-1', url: 'https://x.com/1.jpg' } as any, order: 1 } as any,
      { id: 'img-2', imageResource: { id: 'res-2', url: 'https://x.com/2.jpg' } as any, order: 2 } as any,
      { id: 'img-3', imageResource: { id: 'res-3', url: 'https://x.com/3.jpg' } as any, order: 3 } as any,
    ],
    amenities: ['WiFi', 'Parking'],
    facilities: [{ id: 'fac-1', name: 'Pool' } as any],
    paymentMethods: ['cash', 'card'],
    location: { type: 'Point', coordinates: [-75.5, 6.2] } as any,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeLodgingCompletion', () => {
  // -------------------------------------------------------------------------
  // Test 1: Empty / fresh draft → ~0%, all missing fields, criticalSatisfied=false
  // -------------------------------------------------------------------------
  it('empty draft lodging returns near-0 completion, all expected slugs missing, criticalSatisfied=false', () => {
    const lodging = buildLodging({ name: '' });
    const result = computeLodgingCompletion(lodging);

    expect(result.completionPercentage).toBe(0);
    expect(result.criticalSatisfied).toBe(false);

    // All major missing-field slugs must be present
    const expected = [
      'name',
      'description',
      'townId',
      'address',
      'categories',
      'whatsappNumbers',
      'lowestPrice',
      'lodgingRoomTypes',
      'images',
      'amenities',
      'facilities',
      'paymentMethods',
      'location',
    ];
    for (const slug of expected) {
      expect(result.missingFields).toContain(slug);
    }
  });

  // -------------------------------------------------------------------------
  // Test 2: Fully complete lodging → 100%, no missing fields, criticalSatisfied=true
  // -------------------------------------------------------------------------
  it('fully complete lodging returns completionPercentage=100, missingFields=[], criticalSatisfied=true', () => {
    const lodging = buildFullLodging();
    const result = computeLodgingCompletion(lodging);

    expect(result.completionPercentage).toBe(100);
    expect(result.missingFields).toEqual([]);
    expect(result.criticalSatisfied).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test 3: 80%+ complete but missing one critical field (images=2) → criticalSatisfied=false
  // -------------------------------------------------------------------------
  it('>= 80% complete but images < 3 → criticalSatisfied=false, completionPercentage < 100', () => {
    const lodging = buildFullLodging();
    // Remove one image so only 2 remain (below the critical threshold of 3)
    lodging.images = [
      { id: 'img-1', imageResource: { id: 'res-1' } as any, order: 1 } as any,
      { id: 'img-2', imageResource: { id: 'res-2' } as any, order: 2 } as any,
    ];

    const result = computeLodgingCompletion(lodging);

    expect(result.criticalSatisfied).toBe(false);
    expect(result.completionPercentage).toBeLessThan(100);
    expect(result.missingFields).toContain('images');
  });

  // -------------------------------------------------------------------------
  // Test 4: Description shorter than 50 chars → 'description' in missingFields
  // -------------------------------------------------------------------------
  it('description shorter than 50 chars → description in missingFields', () => {
    const lodging = buildFullLodging();
    lodging.description = 'Too short'; // < 50 chars

    const result = computeLodgingCompletion(lodging);

    expect(result.missingFields).toContain('description');
    expect(result.completionPercentage).toBeLessThan(100);
  });

  // -------------------------------------------------------------------------
  // Test 5: Has email but no phone and no whatsapp
  //   → whatsappNumbers in missingFields (critical)
  //   → Contact bucket gets partial credit because email satisfies the OR sub-condition
  // -------------------------------------------------------------------------
  it('email only (no phone, no whatsapp) → whatsappNumbers missing (critical) but contact gets partial credit', () => {
    const lodging = buildFullLodging();
    lodging.whatsappNumbers = [];
    lodging.phoneNumbers = [];
    lodging.email = 'test@example.com'; // only email

    const result = computeLodgingCompletion(lodging);

    // whatsappNumbers must be flagged (critical)
    expect(result.missingFields).toContain('whatsappNumbers');
    expect(result.criticalSatisfied).toBe(false);

    // Should still be a reasonable score — email satisfies the OR sub-condition
    // Contact bucket: 1 of 2 satisfied → 7.5 pts instead of 0
    // Everything else is complete, so total should be 100 - 20/2 = 90... let's compute:
    // Basic: 20, Contact: 7.5, Price: 10, RoomTypes: 20, Images: 20, Services: 10, Location: 5 = 92.5 → 93
    expect(result.completionPercentage).toBeGreaterThan(80);
  });
});
