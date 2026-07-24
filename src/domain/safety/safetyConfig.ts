import { z } from 'zod';

export const safetyConfigSchema = z.object({
  safeRadiusMeters: z.number().min(5).max(1000),
  warningRatio: z.number().min(0.5).max(0.95),
  separationGraceSeconds: z.number().min(0).max(60),
  staleTimeoutSeconds: z.number().min(5).max(600),
  reunionRadiusMeters: z.number().min(3).max(250),
  gpsAccuracyBufferMeters: z.number().min(0).max(100),
  reunionStableSeconds: z.number().min(0).max(30),
});

export type SafetyConfig = z.infer<typeof safetyConfigSchema>;

export const recommendedSafetyConfig: SafetyConfig = {
  safeRadiusMeters: 50,
  warningRatio: 0.8,
  separationGraceSeconds: 5,
  staleTimeoutSeconds: 30,
  reunionRadiusMeters: 15,
  gpsAccuracyBufferMeters: 8,
  reunionStableSeconds: 3,
};

export const warningThresholdMeters = (config: SafetyConfig) =>
  config.safeRadiusMeters * config.warningRatio;

export function validateSafetyConfig(value: unknown): SafetyConfig {
  return safetyConfigSchema.parse(value);
}

export function updateSafetyConfig(
  current: SafetyConfig,
  patch: Partial<SafetyConfig>,
): { success: true; value: SafetyConfig } | { success: false; message: string } {
  const parsed = safetyConfigSchema.safeParse({ ...current, ...patch });
  if (parsed.success) return { success: true, value: parsed.data };
  return {
    success: false,
    message: parsed.error.issues[0]?.message ?? 'Invalid safety configuration.',
  };
}

export function migrateSafetyConfig(value: unknown): SafetyConfig {
  const parsed = safetyConfigSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  if (value && typeof value === 'object' && 'safeMetres' in value) {
    const legacy = value as Record<string, number>;
    return validateSafetyConfig({
      ...recommendedSafetyConfig,
      safeRadiusMeters: legacy.safeMetres,
      reunionRadiusMeters: legacy.reunionMetres,
      separationGraceSeconds: legacy.separationGraceMs / 1000,
      staleTimeoutSeconds: legacy.offlineAfterMs / 1000,
    });
  }
  return recommendedSafetyConfig;
}
