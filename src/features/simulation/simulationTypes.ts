import type { LocationSample } from '@/types/safety';

export type SimulationSpeed = 0.5 | 1 | 2 | 4;

export interface SimulationStep {
  id: string;
  title: string;
  narration: string;
  location: LocationSample;
  sosActive: boolean;
  crossedBoundaryAt?: number;
  reunionActive: boolean;
  reunionEligible: boolean;
}
