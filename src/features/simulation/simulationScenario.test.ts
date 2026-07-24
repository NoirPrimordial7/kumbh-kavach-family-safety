import { describe, expect, it } from 'vitest';
import { calculateDistanceMeters } from '@/domain/safety/calculateDistance';
import { recommendedSafetyConfig } from '@/domain/safety/safetyConfig';
import { buildSimulationScenario } from './simulationScenario';

const guardian = {
  lat: 20.005556,
  lng: 73.794167,
  accuracy: 5,
  recordedAt: 1_000_000,
};

describe('range-aware deterministic scenario', () => {
  it('scales warning and separated positions with the selected safe radius', () => {
    const small = buildSimulationScenario(
      { ...recommendedSafetyConfig, safeRadiusMeters: 20 },
      guardian,
      1_000_000,
    );
    const large = buildSimulationScenario(
      { ...recommendedSafetyConfig, safeRadiusMeters: 100 },
      guardian,
      1_000_000,
    );
    expect(calculateDistanceMeters(guardian, small[4].location)).toBeLessThan(
      calculateDistanceMeters(guardian, large[4].location),
    );
    expect(calculateDistanceMeters(guardian, small[2].location)).toBeLessThan(20);
    expect(calculateDistanceMeters(guardian, small[3].location)).toBeGreaterThan(20);
  });

  it('returns identical positions for the same seed inputs', () => {
    expect(buildSimulationScenario(recommendedSafetyConfig, guardian, 1_000_000))
      .toEqual(buildSimulationScenario(recommendedSafetyConfig, guardian, 1_000_000));
  });
});
