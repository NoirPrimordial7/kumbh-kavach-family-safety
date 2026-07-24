// Compatibility façade. New code should import from src/domain/safety.
export { calculateDistanceMeters as haversineMetres } from '@/domain/safety/calculateDistance';
export { deriveMemberState as deriveMember } from '@/domain/safety/deriveMemberState';
export {
  deriveFamilyState as deriveFamily,
  withBoundaryTimestamp,
  type ReunionContext,
} from '@/domain/safety/deriveFamilyState';
export {
  recommendedSafetyConfig as safetyThresholds,
  type SafetyConfig,
} from '@/domain/safety/safetyConfig';
