import type { LocationSample, RawMember } from '@/types/safety';
import { calculateDistanceMeters } from './calculateDistance';
import { deriveMemberState } from './deriveMemberState';
import {
  recommendedSafetyConfig,
  type SafetyConfig,
} from './safetyConfig';

export interface ReunionContext {
  memberId?: string;
  eligibleMemberIds?: string[];
  confirmedMemberIds?: string[];
  point?: Pick<LocationSample, 'lat' | 'lng'>;
  insideSinceByMember?: Record<string, number>;
}

export function deriveFamilyState(
  members: RawMember[],
  guardianId: string,
  now: number,
  config: SafetyConfig = recommendedSafetyConfig,
  reunion: ReunionContext = {},
) {
  const guardian = members.find((member) => member.id === guardianId);
  if (!guardian) return [];
  return members.map((member) => deriveMemberState({
    member,
    guardianLocation: guardian.location,
    now,
    config,
    reunion: {
      active: reunion.memberId === member.id,
      eligible: reunion.eligibleMemberIds?.includes(member.id),
      confirmed: reunion.confirmedMemberIds?.includes(member.id),
      point: reunion.point,
      insideSince: reunion.insideSinceByMember?.[member.id],
    },
  }));
}

export function withBoundaryTimestamp(
  member: RawMember,
  guardianLocation: LocationSample,
  now: number,
  config: SafetyConfig = recommendedSafetyConfig,
): RawMember {
  const accuracyAllowance = Math.min(
    member.location.accuracy,
    config.gpsAccuracyBufferMeters,
  );
  const outside = calculateDistanceMeters(guardianLocation, member.location)
    - accuracyAllowance > config.safeRadiusMeters;
  return {
    ...member,
    crossedBoundaryAt: outside
      ? (member.crossedBoundaryAt ?? now)
      : undefined,
  };
}
