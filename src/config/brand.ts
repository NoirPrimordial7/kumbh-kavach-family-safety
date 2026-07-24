import { firebaseEnvironment } from './environment';

export const brand = {
  applicationName: 'Kumbh Kavach',
  shortName: 'Kavach',
  tagline: 'Stay close when the crowd pulls you apart',
  logo: 'KK',
  primaryAccent: '#6C45FF',
  about: 'A private, opt-in family safety network for crowded places.',
  bandNamePrefix: 'KAVACH-BAND',
  ble: {
    serviceUuid: 'f0a00001-0451-4000-b000-000000000001',
    heartbeatUuid: 'f0a00002-0451-4000-b000-000000000001',
    statusUuid: 'f0a00003-0451-4000-b000-000000000001',
    sosUuid: 'f0a00004-0451-4000-b000-000000000001',
    locationUuid: 'f0a00005-0451-4000-b000-000000000001',
    commandUuid: 'f0a00006-0451-4000-b000-000000000001',
    batteryServiceUuid: 'battery_service'
  },
  colors: {
    canvas: '#F2EDE3', ink: '#121212', primary: '#6C45FF', connected: '#2B65F9',
    safe: '#3EA66B', warning: '#F4C84A', separated: '#F05B35', sos: '#A52FE0', offline: '#8A8A82'
  }
} as const;

export const productConfig = {
  firebaseCollections: ['families', 'familyMembers', 'devices', 'locations', 'alerts', 'sessions'],
  sessionDurations: [2, 6, 12] as const,
  firebaseEnabled: firebaseEnvironment.configured,
  firebaseMessage: firebaseEnvironment.message,
};

export type BrandConfig = typeof brand;
