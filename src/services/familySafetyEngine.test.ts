import { describe, expect, it } from 'vitest';
import {
  deriveMember,
  haversineMetres,
  safetyThresholds,
} from './familySafetyEngine';
import type { RawMember } from '@/types/safety';

const now = 1_000_000;
const guardian = { lat: 20.005556, lng: 73.794167, accuracy: 5, recordedAt: now };
const member = (overrides: Partial<RawMember> = {}): RawMember => ({
  id: 'm1',
  name: 'Arya Dhumal',
  relation: 'Team Member · TY-CC2-64',
  deviceName: 'Band 02',
  deviceKind: 'band',
  reality: 'simulated',
  battery: 80,
  connection: 'Simulated',
  lastHeartbeatAt: now,
  locationSharing: true,
  sosActive: false,
  location: guardian,
  trail: [],
  ...overrides,
});

const northBy = (metres: number) => ({
  ...guardian,
  lat: guardian.lat + metres / 111_195,
  accuracy: 0,
});

describe('family safety engine', () => {
  it('calculates a known haversine distance', () => {
    expect(haversineMetres({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111_195, -1);
  });

  it('derives safe and warning at configured boundaries', () => {
    const warningAt = safetyThresholds.safeRadiusMeters * safetyThresholds.warningRatio;
    expect(deriveMember({ member: member(), guardianLocation: guardian, now }).status).toBe('safe');
    expect(deriveMember({
      member: member({ location: northBy(warningAt) }),
      guardianLocation: guardian,
      now,
    }).status).toBe('warning');
  });

  it('honours the exact separation grace period', () => {
    const outside = northBy(safetyThresholds.safeRadiusMeters + 20);
    const graceMs = safetyThresholds.separationGraceSeconds * 1000;
    expect(deriveMember({
      member: member({ location: outside, crossedBoundaryAt: now - graceMs + 1 }),
      guardianLocation: guardian,
      now,
    }).status).toBe('warning');
    expect(deriveMember({
      member: member({ location: outside, crossedBoundaryAt: now - graceMs }),
      guardianLocation: guardian,
      now,
    }).status).toBe('separated');
  });

  it('treats the safe-radius boundary and centimetre offsets explicitly', () => {
    const graceExpired = now - safetyThresholds.separationGraceSeconds * 1000;
    expect(deriveMember({
      member: member({ location: northBy(safetyThresholds.safeRadiusMeters) }),
      guardianLocation: guardian,
      now,
    }).status).toBe('warning');
    expect(deriveMember({
      member: member({
        location: northBy(safetyThresholds.safeRadiusMeters - 0.01),
        crossedBoundaryAt: graceExpired,
      }),
      guardianLocation: guardian,
      now,
    }).status).toBe('warning');
    expect(deriveMember({
      member: member({
        location: northBy(safetyThresholds.safeRadiusMeters + 0.01),
        crossedBoundaryAt: graceExpired,
      }),
      guardianLocation: guardian,
      now,
    }).status).toBe('separated');
  });

  it('uses the configured GPS accuracy buffer conservatively', () => {
    const result = deriveMember({
      member: member({ location: { ...northBy(55), accuracy: 20 } }),
      guardianLocation: guardian,
      now,
    });
    expect(result.effectiveDistanceMetres).toBeCloseTo(47, 0);
    expect(result.status).toBe('warning');
  });

  it('derives offline and keeps SOS as the highest priority', () => {
    const staleAt = now - safetyThresholds.staleTimeoutSeconds * 1000 - 1;
    expect(deriveMember({
      member: member({ lastHeartbeatAt: staleAt }),
      guardianLocation: guardian,
      now,
    }).status).toBe('offline');
    expect(deriveMember({
      member: member({ sosActive: true, lastHeartbeatAt: 0 }),
      guardianLocation: guardian,
      now,
      reunion: { active: true, eligible: true, confirmed: true, point: guardian, insideSince: 0 },
    }).status).toBe('sos');
  });

  it('requires reunion eligibility, confirmation, range, and stability', () => {
    const stableSince = now - safetyThresholds.reunionStableSeconds * 1000;
    const baseReunion = { active: true, eligible: true, confirmed: true, point: guardian };
    expect(deriveMember({
      member: member(),
      guardianLocation: guardian,
      now,
      reunion: { ...baseReunion, insideSince: stableSince + 1 },
    }).status).toBe('safe');
    expect(deriveMember({
      member: member(),
      guardianLocation: guardian,
      now,
      reunion: { ...baseReunion, insideSince: stableSince },
    }).status).toBe('reunited');
    expect(deriveMember({
      member: member({ location: northBy(safetyThresholds.reunionRadiusMeters + 1) }),
      guardianLocation: guardian,
      now,
      reunion: { ...baseReunion, insideSince: stableSince },
    }).status).not.toBe('reunited');
  });
});
