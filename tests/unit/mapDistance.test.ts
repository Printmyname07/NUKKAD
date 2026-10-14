/**
 * Unit Test Suite: Map Distance & Navigation Calculations
 */

import { calculateDistanceMeters, getDirectionsUrl, JAIPUR_COORDINATES } from '../../src/services/maps/index.ts';

function runMapTests() {
  console.log('[TEST] Running Map Integration Unit Tests...');

  // 1. Same coordinates should yield 0 meters
  const zeroDistance = calculateDistanceMeters(JAIPUR_COORDINATES, JAIPUR_COORDINATES);
  if (zeroDistance !== 0) {
    throw new Error(`Expected zero distance, got ${zeroDistance}`);
  }
  console.log('  ✓ calculateDistanceMeters: Identity coordinate returns 0m');

  // 2. Known distance between Bapu Bazaar (26.9185, 75.8242) and Raja Park (26.8924, 75.8315)
  const d = calculateDistanceMeters(
    { latitude: 26.9185, longitude: 75.8242 },
    { latitude: 26.8924, longitude: 75.8315 }
  );
  if (d < 2500 || d > 3500) {
    throw new Error(`Calculated distance ${d}m is out of expected ~2950m range`);
  }
  console.log(`  ✓ calculateDistanceMeters: Jaipur Bapu Bazaar to Raja Park ~${d}m`);

  // 3. Directions URL formatting
  const url = getDirectionsUrl(JAIPUR_COORDINATES, 'Pink City');
  if (!url.includes('destination=26.9124,75.7873')) {
    throw new Error(`Malformed directions URL: ${url}`);
  }
  console.log('  ✓ getDirectionsUrl: Formats valid URL');

  console.log('[TEST] All Map Unit Tests Passed.\n');
}

runMapTests();
