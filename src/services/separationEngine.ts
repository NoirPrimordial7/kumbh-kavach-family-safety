import type { MemberStatus, Position } from '../types/domain';

const earthRadius = 6_371_000;
const radians = (degrees: number) => degrees * Math.PI / 180;

export function haversineDistance(a: Position, b: Position) {
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export interface SeparationInput {
  guardian: Position; member: Position; lastHeartbeat: number; now: number; safeRadius: number;
  warningMultiplier: number; staleTimeoutSeconds: number; sos: boolean; wasSeparated: boolean; reunionRadius: number;
}

export function calculateStatus(input: SeparationInput): { status: MemberStatus; distance: number } {
  const distance = haversineDistance(input.guardian, input.member);
  if (input.sos) return { status: 'sos', distance };
  if (input.now - input.lastHeartbeat > input.staleTimeoutSeconds * 1000) return { status: 'offline', distance };
  if (input.wasSeparated && distance <= input.reunionRadius) return { status: 'reunited', distance };
  if (distance > input.safeRadius) return { status: 'separated', distance };
  if (distance > input.safeRadius * input.warningMultiplier) return { status: 'warning', distance };
  return { status: 'safe', distance };
}
