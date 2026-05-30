import { Commerce } from '../entities';

export interface CommerceCompletionResult {
  completionPercentage: number;
  missingFields: string[];
  criticalSatisfied: boolean;
}

/**
 * Computes the completion status of a commerce for the owner onboarding wizard.
 *
 * Weighted buckets (sum to 100):
 *  - Información básica (20%): name, description>=50, townId, address, categories>=1
 *  - Contacto         (15%): whatsappNumbers>=1 (critical), email OR phoneNumbers>=1
 *  - Productos        (20%): commerceProducts>=1 with name + price>0 (critical)
 *  - Fotos            (20%): images>=3 (critical)
 *  - Servicios        (10%): services>=1 AND facilities>=1 AND paymentMethods>=1
 *  - Ubicación        (15%): location non-null AND address non-empty
 *
 * Critical fields for `criticalSatisfied`: whatsappNumbers, commerceProducts, images.
 *
 * @param commerce - The Commerce entity with relations loaded (categories, facilities, products, images)
 * @returns Completion percentage (0-100), missing field slugs, and critical satisfied flag
 */
export function computeCommerceCompletion(commerce: Commerce): CommerceCompletionResult {
  const missingFields: string[] = [];
  let totalScore = 0;

  // ------------------------------------------------------------------------------------------------
  // Bucket 1: Información básica (weight 20)
  // ------------------------------------------------------------------------------------------------
  const basicConditions = {
    name: !!(commerce.name && commerce.name.trim().length > 0),
    description: !!(commerce.description && commerce.description.trim().length >= 50),
    townId: !!commerce.town?.id,
    address: !!(commerce.address && commerce.address.trim().length > 0),
    categories: !!(commerce.categories && commerce.categories.length >= 1),
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
  const hasWhatsapp = !!(commerce.whatsappNumbers && commerce.whatsappNumbers.length >= 1);
  const hasEmailOrPhone =
    !!(commerce.email && commerce.email.trim().length > 0) ||
    !!(commerce.phoneNumbers && commerce.phoneNumbers.length >= 1);

  const contactSatisfied = (hasWhatsapp ? 1 : 0) + (hasEmailOrPhone ? 1 : 0);
  const contactTotal = 2;
  totalScore += (contactSatisfied / contactTotal) * 15;

  if (!hasWhatsapp) missingFields.push('whatsappNumbers');

  // ------------------------------------------------------------------------------------------------
  // Bucket 3: Productos / Servicios (weight 20)
  // At least 1 commerce_product with name + price>0 (critical). Type (product|service) is irrelevant
  // for the gate — both count.
  // ------------------------------------------------------------------------------------------------
  const validProducts = (commerce.products ?? []).filter(
    p => p.name && p.name.trim().length > 0 && Number(p.price) > 0,
  );
  const hasProducts = validProducts.length >= 1;

  totalScore += hasProducts ? 20 : 0;

  if (!hasProducts) missingFields.push('commerceProducts');

  // ------------------------------------------------------------------------------------------------
  // Bucket 4: Fotos (weight 20)
  // images>=3 is critical
  // ------------------------------------------------------------------------------------------------
  const imageCount = (commerce.images ?? []).filter(img => img.imageResource != null).length;
  const hasImages = imageCount >= 3;

  totalScore += hasImages ? 20 : 0;

  if (!hasImages) missingFields.push('images');

  // ------------------------------------------------------------------------------------------------
  // Bucket 5: Servicios secundarios (weight 10)
  // services>=1 AND facilities>=1 AND paymentMethods>=1 (no single critical field)
  // ------------------------------------------------------------------------------------------------
  const hasServices = !!(commerce.services && commerce.services.length >= 1);
  const hasFacilities = !!(commerce.facilities && commerce.facilities.length >= 1);
  const hasPaymentMethods = !!(commerce.paymentMethods && commerce.paymentMethods.length >= 1);

  const servicesSatisfied = (hasServices ? 1 : 0) + (hasFacilities ? 1 : 0) + (hasPaymentMethods ? 1 : 0);
  const servicesTotal = 3;
  totalScore += (servicesSatisfied / servicesTotal) * 10;

  if (!hasServices) missingFields.push('services');
  if (!hasFacilities) missingFields.push('facilities');
  if (!hasPaymentMethods) missingFields.push('paymentMethods');

  // ------------------------------------------------------------------------------------------------
  // Bucket 6: Ubicación (weight 15)
  // location (PostGIS point) non-null AND address non-empty (already counted in basic, but the
  // bucket needs a point to be considered complete on the map)
  // ------------------------------------------------------------------------------------------------
  const hasLocation = !!(commerce.location && commerce.location.coordinates);

  totalScore += hasLocation ? 15 : 0;

  if (!hasLocation) missingFields.push('location');

  // ------------------------------------------------------------------------------------------------
  // Critical fields: must ALL be satisfied for criticalSatisfied=true
  // ★ whatsappNumbers>=1, commerceProducts>=1 valid, images>=3
  // ------------------------------------------------------------------------------------------------
  const criticalSatisfied = hasWhatsapp && hasProducts && hasImages;

  // Clamp to [0, 100]
  const completionPercentage = Math.round(Math.min(100, Math.max(0, totalScore)));

  return { completionPercentage, missingFields, criticalSatisfied };
}
