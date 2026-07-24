import type { DerivedMember, LocationSample, RawMember, SafetyStatus } from '@/types/safety';
import { calculateDistanceMeters } from './calculateDistance';
import {
  recommendedSafetyConfig,
  warningThresholdMeters,
  type SafetyConfig,
} from './safetyConfig';

export interface ReunionStateInput {
  active?: boolean;
  eligible?: boolean;
  confirmed?: boolean;
  point?: Pick<LocationSample, 'lat' | 'lng'>;
  insideSince?: number;
}

export interface DeriveMemberInput {
  member: RawMember;
  guardianLocation: LocationSample;
  now: number;
  config?: SafetyConfig;
  reunion?: ReunionStateInput;
}

export function deriveMemberState({
  member,
  guardianLocation,
  now,
  config = recommendedSafetyConfig,
  reunion = {},
}: DeriveMemberInput): DerivedMember {
  const distanceMetres = calculateDistanceMeters(guardianLocation, member.location);
  const accuracyAllowance = Math.min(
    member.location.accuracy,
    config.gpsAccuracyBufferMeters,
  );
  const effectiveDistanceMetres = Math.max(0, distanceMetres - accuracyAllowance);
  const heartbeatAgeMs = Math.max(0, now - member.lastHeartbeatAt);
  const reunionDistanceMetres = reunion.point
    ? calculateDistanceMeters(reunion.point, member.location)
    : distanceMetres;
  const stableForMs = reunion.insideSince === undefined
    ? 0
    : Math.max(0, now - reunion.insideSince);
  const reunionStable = stableForMs >= config.reunionStableSeconds * 1000;
  let status: SafetyStatus;

  if (member.sosActive) status = 'sos';
  else if (!member.locationSharing || heartbeatAgeMs > config.staleTimeoutSeconds * 1000) {
    status = 'offline';
  } else if (
    reunion.active
    && reunion.eligible
    && reunion.confirmed
    && reunionDistanceMetres <= config.reunionRadiusMeters
    && reunionStable
  ) {
    status = 'reunited';
  } else if (effectiveDistanceMetres > config.safeRadiusMeters) {
    const graceExpired = member.crossedBoundaryAt !== undefined
      && now - member.crossedBoundaryAt >= config.separationGraceSeconds * 1000;
    status = graceExpired ? 'separated' : 'warning';
  } else if (effectiveDistanceMetres >= warningThresholdMeters(config)) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  return {
    ...member,
    distanceMetres,
    effectiveDistanceMetres,
    reunionDistanceMetres,
    heartbeatAgeMs,
    status,
  };
}
