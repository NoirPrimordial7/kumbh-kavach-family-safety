import { describe, expect, it } from 'vitest';
import {
  migrateSafetyConfig,
  recommendedSafetyConfig,
  updateSafetyConfig,
  validateSafetyConfig,
  warningThresholdMeters,
} from './safetyConfig';

describe('safety configuration', () => {
  it('uses documented recommended defaults', () => {
    expect(recommendedSafetyConfig).toMatchObject({
      safeRadiusMeters: 50,
      warningRatio: 0.8,
      reunionRadiusMeters: 15,
    });
    expect(warningThresholdMeters(recommendedSafetyConfig)).toBe(40);
  });

  it.each([
    ['safeRadiusMeters', 4],
    ['safeRadiusMeters', 1001],
    ['warningRatio', 0.49],
    ['reunionRadiusMeters', 251],
    ['staleTimeoutSeconds', 4],
  ] as const)('rejects invalid %s values', (key, value) => {
    expect(updateSafetyConfig(recommendedSafetyConfig, { [key]: value })).toMatchObject({
      success: false,
    });
  });

  it('accepts exact lower and upper safe-radius boundaries', () => {
    expect(validateSafetyConfig({ ...recommendedSafetyConfig, safeRadiusMeters: 5 })
      .safeRadiusMeters).toBe(5);
    expect(validateSafetyConfig({ ...recommendedSafetyConfig, safeRadiusMeters: 1000 })
      .safeRadiusMeters).toBe(1000);
  });

  it('migrates the legacy millisecond configuration', () => {
    expect(migrateSafetyConfig({
      safeMetres: 75,
      reunionMetres: 12,
      separationGraceMs: 8_000,
      offlineAfterMs: 45_000,
    })).toMatchObject({
      safeRadiusMeters: 75,
      reunionRadiusMeters: 12,
      separationGraceSeconds: 8,
      staleTimeoutSeconds: 45,
    });
  });

  it('falls back safely for corrupt persisted state', () => {
    expect(migrateSafetyConfig({ safeRadiusMeters: 'unsafe' }))
      .toEqual(recommendedSafetyConfig);
  });
});
