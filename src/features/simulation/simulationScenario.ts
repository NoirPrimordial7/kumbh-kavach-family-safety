import { offsetCoordinate } from '@/domain/safety/calculateDistance';
import {
  warningThresholdMeters,
  type SafetyConfig,
} from '@/domain/safety/safetyConfig';
import type { LocationSample } from '@/types/safety';
import type { SimulationStep } from './simulationTypes';

export const DEMO_SEED = 20260724;

const sampleAt = (
  origin: LocationSample,
  distanceMeters: number,
  now: number,
  accuracy = 5,
): LocationSample => {
  const bearing = 2.45;
  const coordinate = offsetCoordinate(
    origin,
    Math.cos(bearing) * distanceMeters,
    Math.sin(bearing) * distanceMeters,
  );
  return { ...coordinate, accuracy, recordedAt: now };
};

export function buildSimulationScenario(
  config: SafetyConfig,
  guardianLocation: LocationSample,
  now: number,
): SimulationStep[] {
  const warning = warningThresholdMeters(config);
  const warningDistance = warning + (config.safeRadiusMeters - warning) * 0.55;
  const beyond = config.safeRadiusMeters + Math.max(8, config.safeRadiusMeters * 0.22);
  const approach = Math.max(
    config.reunionRadiusMeters * 2.2,
    config.safeRadiusMeters * 0.35,
  );
  const graceExpiredAt = now - config.separationGraceSeconds * 1000 - 1;

  return [
    {
      id: 'safe',
      title: 'Safe and close',
      narration: 'Everyone is close and updating around Ramkund.',
      location: sampleAt(guardianLocation, config.safeRadiusMeters * 0.3, now),
      sosActive: false,
      reunionActive: false,
      reunionEligible: false,
    },
    {
      id: 'moving',
      title: 'Moving through crowd',
      narration: 'Arya Dhumal starts moving through the riverfront crowd.',
      location: sampleAt(guardianLocation, warning * 0.9, now),
      sosActive: false,
      reunionActive: false,
      reunionEligible: false,
    },
    {
      id: 'warning',
      title: 'Early warning',
      narration: 'Arya enters the configurable early-warning band.',
      location: sampleAt(guardianLocation, warningDistance, now, 0),
      sosActive: false,
      reunionActive: false,
      reunionEligible: true,
    },
    {
      id: 'grace',
      title: 'Separation grace',
      narration: `Arya crosses ${config.safeRadiusMeters}m; the ${config.separationGraceSeconds}-second grace period begins.`,
      location: sampleAt(guardianLocation, beyond, now, 7),
      sosActive: false,
      crossedBoundaryAt: now,
      reunionActive: false,
      reunionEligible: true,
    },
    {
      id: 'separated',
      title: 'Separated',
      narration: 'The grace period expires and a separation alert opens.',
      location: sampleAt(guardianLocation, beyond, now),
      sosActive: false,
      crossedBoundaryAt: graceExpiredAt,
      reunionActive: false,
      reunionEligible: true,
    },
    {
      id: 'sos',
      title: 'Simulated SOS',
      narration: 'Arya raises a clearly labelled simulated SOS from Band 02.',
      location: sampleAt(guardianLocation, beyond, now),
      sosActive: true,
      crossedBoundaryAt: graceExpiredAt,
      reunionActive: false,
      reunionEligible: true,
    },
    {
      id: 'reunion-start',
      title: 'Reunion started',
      narration: 'The guardian starts private Reunion Mode and selects a meeting point.',
      location: sampleAt(guardianLocation, beyond, now),
      sosActive: false,
      crossedBoundaryAt: graceExpiredAt,
      reunionActive: true,
      reunionEligible: true,
    },
    {
      id: 'reunion-approach',
      title: 'Both approaching',
      narration: 'Guardian and member move toward the configured reunion point.',
      location: sampleAt(guardianLocation, approach, now),
      sosActive: false,
      reunionActive: true,
      reunionEligible: true,
    },
    {
      id: 'reunion-verify',
      title: 'Verifying reunion',
      narration: `Arya enters the ${config.reunionRadiusMeters}m reunion radius and waits for the stable-time check.`,
      location: sampleAt(guardianLocation, config.reunionRadiusMeters * 0.55, now),
      sosActive: false,
      reunionActive: true,
      reunionEligible: true,
    },
  ];
}
