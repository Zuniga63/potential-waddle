import { Transport } from '../entities/transport.entity';

const PLACEHOLDER = '—';

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0 && value !== PLACEHOLDER;
  return true;
}

export interface TransportCompletionResult {
  completionPercentage: number;
  infoPercentage: number;
  missingFields: string[];
  infoMissingFields: string[];
  infoCriticalSatisfied: boolean;
  readyToSubmit: boolean;
}

export function computeTransportCompletion(transport: Transport): TransportCompletionResult {
  const checks: Array<[string, boolean]> = [
    ['firstName', isFilled(transport.firstName)],
    ['lastName', isFilled(transport.lastName)],
    ['documentType', isFilled(transport.documentType)],
    ['document', isFilled(transport.document)],
    ['phone', isFilled(transport.phone)],
    ['email', isFilled(transport.email)],
    ['licensePlate', isFilled(transport.licensePlate)],
    ['townId', isFilled(transport.town?.id)],
  ];
  const filled = checks.filter(([, ok]) => ok).length;
  const total = checks.length;
  const infoPercentage = Math.round((filled / total) * 100);
  const infoMissingFields = checks.filter(([, ok]) => !ok).map(([slug]) => slug);

  // Critical fields = the same checks; if any missing → not critical-satisfied.
  const infoCriticalSatisfied = infoMissingFields.length === 0;

  return {
    completionPercentage: infoPercentage,
    infoPercentage,
    missingFields: infoMissingFields,
    infoMissingFields,
    infoCriticalSatisfied,
    readyToSubmit: infoCriticalSatisfied,
  };
}
