import type { DerivedMember, LocationSample, RawMember, SafetyStatus, SafetyThresholds } from '@/types/safety';

export const safetyThresholds: SafetyThresholds = {
  safeMetres: 50,
  warningMetres: 65,
  separationGraceMs: 8_000,
  offlineAfterMs: 25_000,
  reunionMetres: 15,
};

const EARTH_RADIUS_METRES = 6_371_008.8;
const radians = (degrees: number) => degrees * Math.PI / 180;

export function haversineMetres(a: Pick<LocationSample, 'lat' | 'lng'>, b: Pick<LocationSample, 'lat' | 'lng'>): number {
  const latDelta = radians(b.lat - a.lat);
  const lngDelta = radians(b.lng - a.lng);
  const aLat = radians(a.lat);
  const bLat = radians(b.lat);
  const value = Math.sin(latDelta / 2) ** 2 + Math.cos(aLat) * Math.cos(bLat) * Math.sin(lngDelta / 2) ** 2;
  return EARTH_RADIUS_METRES * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export interface DeriveStatusInput {
  member: RawMember;
  guardianLocation: LocationSample;
  now: number;
  reunionActive?: boolean;
  thresholds?: SafetyThresholds;
}

export function deriveMember(input: DeriveStatusInput): DerivedMember {
  const { member, guardianLocation, now, reunionActive = false, thresholds = safetyThresholds } = input;
  const distanceMetres = haversineMetres(guardianLocation, member.location);
  const heartbeatAgeMs = Math.max(0, now - member.lastHeartbeatAt);
  let status: SafetyStatus;

  if (member.sosActive) status = 'sos';
  else if (!member.locationSharing || heartbeatAgeMs > thresholds.offlineAfterMs) status = 'offline';
  else if (reunionActive && distanceMetres <= thresholds.reunionMetres) status = 'reunited';
  else if (distanceMetres <= thresholds.safeMetres) status = 'safe';
  else if (distanceMetres <= thresholds.warningMetres) status = 'warning';
  else if (!member.crossedBoundaryAt || now - member.crossedBoundaryAt < thresholds.separationGraceMs) status = 'warning';
  else status = 'separated';

  return { ...member, distanceMetres, heartbeatAgeMs, status };
}

export function deriveFamily(members: RawMember[], guardianId: string, now: number, reunionMemberId?: string): DerivedMember[] {
  const guardian = members.find((member) => member.id === guardianId);
  if (!guardian) return [];
  return members.map((member) => deriveMember({ member, guardianLocation: guardian.location, now, reunionActive: reunionMemberId === member.id }));
}

export function withBoundaryTimestamp(member: RawMember, guardianLocation: LocationSample, now: number, thresholds = safetyThresholds): RawMember {
  const outside = haversineMetres(guardianLocation, member.location) > thresholds.warningMetres;
  return { ...member, crossedBoundaryAt: outside ? (member.crossedBoundaryAt ?? now) : undefined };
}
