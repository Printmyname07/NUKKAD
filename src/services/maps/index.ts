/**
 * Map & Spatial Location Utility
 *
 * Self-contained local prototype helper:
 * - Mathematical distance calculation (Haversine formula) without external APIs
 * - Standard web navigation direction URLs without requiring API tokens
 * - Preserves Jaipur pilot coordinates and location text
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Jaipur Pilot Center Coordinates
export const JAIPUR_COORDINATES: Coordinates = {
  latitude: 26.9124,
  longitude: 75.7873,
};

/**
 * Calculates straight-line distance in meters using the standard Haversine formula.
 * Requires zero external API calls or tokens.
 */
export function calculateDistanceMeters(start: Coordinates, end: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (start.latitude * Math.PI) / 180;
  const phi2 = (end.latitude * Math.PI) / 180;
  const deltaPhi = ((end.latitude - start.latitude) * Math.PI) / 180;
  const deltaLambda = ((end.longitude - start.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Returns a standardized mobile directions URL that opens natively in the user's browser.
 * Requires zero external API keys.
 */
export function getDirectionsUrl(destination: Coordinates, label: string): string {
  const encLabel = encodeURIComponent(label);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&query=${encLabel}`;
}
