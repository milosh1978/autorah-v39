/**
 * Normalizes vehicle data for consistent storage and comparison.
 */

export const normalizePlate = (plate) => {
  if (!plate) return '';
  // Uppercase, remove spaces, remove hyphens
  // P 111809, P-111809, p111809 -> P111809
  return plate.toUpperCase().replace(/[\s-]/g, '');
};

export const normalizeVin = (vin) => {
  if (!vin) return '';
  // Uppercase, trim
  return vin.toUpperCase().trim();
};

export const normalizeEngine = (engine) => {
  if (!engine) return '';
  // Uppercase, trim
  return engine.toUpperCase().trim();
};
