import { Lodging } from '../entities';

export interface LodgingCompletionResult {
  completionPercentage: number;
  missingFields: string[];
  criticalSatisfied: boolean;
}

/**
 * Computes the completion status of a lodging for the owner onboarding wizard.
 *
 * Weighted buckets per BACKEND-SPEC §5:
 *  - Basic info      (20%): name, description>=50, townId, address, categories>=1
 *  - Contact         (15%): whatsappNumbers>=1 (critical), email OR phoneNumbers>=1
 *  - Price           (10%): lowestPrice>0 (critical)
 *  - Room types      (20%): lodgingRoomTypes>=1 with name+price+maxCapacity (critical)
 *  - Photos          (20%): images>=3 (critical)
 *  - Services        (10%): amenities>=1 AND facilities>=1 AND paymentMethods>=1
 *  - Location         (5%): location non-null
 *
 * @param lodging - The Lodging entity with relations loaded
 * @returns Completion percentage (0-100), missing field slugs, and critical satisfied flag
 */
export function computeLodgingCompletion(lodging: Lodging): LodgingCompletionResult {
  const missingFields: string[] = [];
  let totalScore = 0;

  // ------------------------------------------------------------------------------------------------
  // Bucket 1: Información básica (weight 20)
  // ------------------------------------------------------------------------------------------------
  const basicConditions = {
    name: !!(lodging.name && lodging.name.trim().length > 0),
    description: !!(lodging.description && lodging.description.trim().length >= 50),
    townId: !!(lodging.town?.id),
    address: !!(lodging.address && lodging.address.trim().length > 0),
    categories: !!(lodging.categories && lodging.categories.length >= 1),
  };

  const basicSatisfied = Object.values(basicConditions).filter(Boolean).length;
  const basicTotal = Object.keys(basicConditions).length;
  totalScore += (basicSatisfied / basicTotal) * 20;

  if (!basicConditions.name) missingFields.push('name');
  if (!basicConditions.description) missingFields.push('description');
  if (!basicConditions.townId) missingFields.push('townId');
  if (!basicConditions.address) missingFields.push('address');
  if (!basicConditions.categories) missingFields.push('categories');

  // ------------------------------------------------------------------------------------------------
  // Bucket 2: Contacto (weight 15)
  // whatsappNumbers>=1 is critical; email OR phoneNumbers>=1 is a separate sub-condition
  // ------------------------------------------------------------------------------------------------
  const hasWhatsapp = !!(lodging.whatsappNumbers && lodging.whatsappNumbers.length >= 1);
  const hasEmailOrPhone =
    !!(lodging.email && lodging.email.trim().length > 0) ||
    !!(lodging.phoneNumbers && lodging.phoneNumbers.length >= 1);

  const contactSatisfied = (hasWhatsapp ? 1 : 0) + (hasEmailOrPhone ? 1 : 0);
  const contactTotal = 2;
  totalScore += (contactSatisfied / contactTotal) * 15;

  if (!hasWhatsapp) missingFields.push('whatsappNumbers');

  // ------------------------------------------------------------------------------------------------
  // Bucket 3: Precio (weight 10)
  // ------------------------------------------------------------------------------------------------
  const hasLowestPrice = !!(lodging.lowestPrice !== null && lodging.lowestPrice !== undefined && Number(lodging.lowestPrice) > 0);

  totalScore += hasLowestPrice ? 10 : 0;

  if (!hasLowestPrice) missingFields.push('lowestPrice');

  // ------------------------------------------------------------------------------------------------
  // Bucket 4: Habitaciones (weight 20)
  // At least 1 room type with name + price + maxCapacity (critical)
  // — UNLESS the owner explicitly opted out via roomsNotApplicable=true (apartments,
  // whole-house rentals, hotels that don't want to enumerate room types).
  // ------------------------------------------------------------------------------------------------
  const validRoomTypes = (lodging.lodgingRoomTypes ?? []).filter(
    rt => rt.name && rt.name.trim().length > 0 && Number(rt.price) > 0 && rt.maxCapacity > 0,
  );
  const hasRoomTypes = validRoomTypes.length >= 1 || lodging.roomsNotApplicable === true;

  totalScore += hasRoomTypes ? 20 : 0;

  if (!hasRoomTypes) missingFields.push('lodgingRoomTypes');

  // ------------------------------------------------------------------------------------------------
  // Bucket 5: Fotos (weight 20)
  // images>=3 is critical
  // ------------------------------------------------------------------------------------------------
  const imageCount = (lodging.images ?? []).filter(img => img.imageResource != null).length;
  const hasImages = imageCount >= 3;

  totalScore += hasImages ? 20 : 0;

  if (!hasImages) missingFields.push('images');

  // ------------------------------------------------------------------------------------------------
  // Bucket 6: Servicios (weight 10)
  // amenities>=1 AND facilities>=1 AND paymentMethods>=1 (no single critical field)
  // ------------------------------------------------------------------------------------------------
  const hasAmenities = !!(lodging.amenities && lodging.amenities.length >= 1);
  const hasFacilities = !!(lodging.facilities && lodging.facilities.length >= 1);
  const hasPaymentMethods = !!(lodging.paymentMethods && lodging.paymentMethods.length >= 1);

  const servicesSatisfied = (hasAmenities ? 1 : 0) + (hasFacilities ? 1 : 0) + (hasPaymentMethods ? 1 : 0);
  const servicesTotal = 3;
  totalScore += (servicesSatisfied / servicesTotal) * 10;

  if (!hasAmenities) missingFields.push('amenities');
  if (!hasFacilities) missingFields.push('facilities');
  if (!hasPaymentMethods) missingFields.push('paymentMethods');

  // ------------------------------------------------------------------------------------------------
  // Bucket 7: Ubicación (weight 5)
  // location (PostGIS point) non-null
  // ------------------------------------------------------------------------------------------------
  const hasLocation = !!(lodging.location && lodging.location.coordinates);

  totalScore += hasLocation ? 5 : 0;

  if (!hasLocation) missingFields.push('location');

  // ------------------------------------------------------------------------------------------------
  // Critical fields: must ALL be satisfied for criticalSatisfied=true
  // ★ whatsappNumbers>=1, lowestPrice>0, lodgingRoomTypes>=1 valid, images>=3
  // ------------------------------------------------------------------------------------------------
  const criticalSatisfied = hasWhatsapp && hasLowestPrice && hasRoomTypes && hasImages;

  // Clamp to [0, 100]
  const completionPercentage = Math.round(Math.min(100, Math.max(0, totalScore)));

  return { completionPercentage, missingFields, criticalSatisfied };
}
