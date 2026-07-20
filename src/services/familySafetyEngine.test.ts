import { describe, expect, it } from 'vitest';
import { deriveMember, haversineMetres, safetyThresholds } from './familySafetyEngine';
import type { RawMember } from '@/types/safety';

const now = 1_000_000;
const guardian = { lat: 20.005556, lng: 73.794167, accuracy: 5, recordedAt: now };
const member = (overrides: Partial<RawMember> = {}): RawMember => ({
  id: 'm1', name: 'Arya', relation: 'Daughter', deviceName: 'Band 02', deviceKind: 'band', reality: 'simulated',
  battery: 80, connection: 'Simulated', lastHeartbeatAt: now, locationSharing: true, sosActive: false,
  location: guardian, trail: [], ...overrides,
});

describe('family safety engine', () => {
  it('calculates haversine distance', () => {
    expect(haversineMetres({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111_195, -1);
  });

  it('derives safe and warning from distance', () => {
    expect(deriveMember({ member: member(), guardianLocation: guardian, now }).status).toBe('safe');
    const warningLocation = { ...guardian, lat: guardian.lat + 55 / 111_195 };
    expect(deriveMember({ member: member({ location: warningLocation }), guardianLocation: guardian, now }).status).toBe('warning');
  });

  it('honours the separation grace period', () => {
    const outside = { ...guardian, lat: guardian.lat + 90 / 111_195 };
    expect(deriveMember({ member: member({ location: outside, crossedBoundaryAt: now - safetyThresholds.separationGraceMs + 1 }), guardianLocation: guardian, now }).status).toBe('warning');
    expect(deriveMember({ member: member({ location: outside, crossedBoundaryAt: now - safetyThresholds.separationGraceMs }), guardianLocation: guardian, now }).status).toBe('separated');
  });

  it('derives offline, SOS, and reunion states from raw signals', () => {
    expect(deriveMember({ member: member({ lastHeartbeatAt: now - 25_001 }), guardianLocation: guardian, now }).status).toBe('offline');
    expect(deriveMember({ member: member({ sosActive: true, lastHeartbeatAt: 0 }), guardianLocation: guardian, now }).status).toBe('sos');
    expect(deriveMember({ member: member(), guardianLocation: guardian, now, reunionActive: true }).status).toBe('reunited');
  });
});
