import type { DerivedMember, LocationSample, SafetyStatus } from './safety';

export type MemberStatus = SafetyStatus;
export type DeviceKind = 'desktop' | 'phone' | 'band';
export type DeviceReality = 'real' | 'simulated' | 'phone' | 'offline';
export type ConnectionKind = 'Bluetooth' | 'Local Wi-Fi' | 'WebSocket' | 'Simulated';
export type Position = LocationSample & { at: number };

export interface FamilyMember extends Omit<DerivedMember, 'location' | 'trail' | 'deviceKind' | 'reality'> {
  deviceKind: DeviceKind;
  reality: DeviceReality;
  distance: number;
  lastHeartbeat: number;
  position: Position;
  trail: Position[];
}

export interface FamilySession {
  id: string;
  joinCode: string;
  privateKey: string;
  name: string;
  guardianName: string;
  eventName: string;
  safetyRadius: number;
  durationHours: number;
  emergencyContact?: string;
  startedAt: number;
  trackingPaused: boolean;
}

export interface ActivityEvent { id: string; at: number; type: string; message: string }
export interface AlertRecord { id: string; memberId: string; at: number; kind: 'separation' | 'sos' | 'offline'; resolved: boolean; message: string }
export interface BluetoothCandidate { deviceId: string; deviceName: string }
