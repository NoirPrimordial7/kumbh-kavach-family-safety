export type SafetyStatus = 'safe' | 'warning' | 'separated' | 'offline' | 'sos' | 'reunited';
export type DeviceKind = 'phone' | 'band';
export type DeviceReality = 'phone' | 'simulated' | 'real';

export interface LocationSample {
  lat: number;
  lng: number;
  accuracy: number;
  recordedAt: number;
}

export interface RawMember {
  id: string;
  name: string;
  relation: string;
  deviceName: string;
  deviceKind: DeviceKind;
  reality: DeviceReality;
  battery: number;
  connection: 'Bluetooth' | 'Local Wi-Fi' | 'WebSocket' | 'Simulated';
  lastHeartbeatAt: number;
  locationSharing: boolean;
  sosActive: boolean;
  crossedBoundaryAt?: number;
  location: LocationSample;
  trail: LocationSample[];
}

export interface SafetyThresholds {
  safeMetres: number;
  warningMetres: number;
  separationGraceMs: number;
  offlineAfterMs: number;
  reunionMetres: number;
}

export interface DerivedMember extends RawMember {
  distanceMetres: number;
  status: SafetyStatus;
  heartbeatAgeMs: number;
}

export interface SafetyAlert {
  id: string;
  memberId: string;
  kind: 'separation' | 'sos' | 'offline';
  openedAt: number;
  updatedAt: number;
  resolvedAt?: number;
}
