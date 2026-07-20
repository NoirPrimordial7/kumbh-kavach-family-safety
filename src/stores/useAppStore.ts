import { create } from 'zustand';
import { mapConfig } from '@/config/mapConfig';
import { reconcileAlerts } from '@/services/alertEngine';
import { deriveFamily, withBoundaryTimestamp } from '@/services/familySafetyEngine';
import type { ActivityEvent, AlertRecord, FamilyMember, FamilySession } from '@/types/domain';
import type { RawMember, SafetyAlert } from '@/types/safety';

export type Page = 'home' | 'map' | 'family' | 'alerts' | 'simulation' | 'settings';

const GUARDIAN_ID = 'guardian-phone';
const started = Date.now();
const location = (lat: number, lng: number, at = started, accuracy = 5) => ({ lat, lng, accuracy, recordedAt: at });
const baseLocations = {
  guardian: location(20.005556, 73.794167),
  meera: location(20.00573, 73.79431),
  ishaan: location(20.00533, 73.79403),
  arya: location(20.00568, 73.79386),
};

const seededMembers = (): RawMember[] => [
  { id: GUARDIAN_ID, name: 'Aarav', relation: 'Guardian', deviceName: 'Guardian Phone', deviceKind: 'phone', reality: 'phone', battery: 92, connection: 'Local Wi-Fi', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.guardian, trail: [] },
  { id: 'member-phone', name: 'Meera', relation: 'Mother', deviceName: "Meera's Phone", deviceKind: 'phone', reality: 'simulated', battery: 78, connection: 'WebSocket', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.meera, trail: [] },
  { id: 'band-01', name: 'Ishaan', relation: 'Son', deviceName: 'Smart Mauli Band 01', deviceKind: 'band', reality: 'simulated', battery: 84, connection: 'Bluetooth', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.ishaan, trail: [] },
  { id: 'band-02', name: 'Arya', relation: 'Daughter', deviceName: 'Smart Mauli Band 02', deviceKind: 'band', reality: 'simulated', battery: 71, connection: 'Bluetooth', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.arya, trail: [] },
];

const seededSession: FamilySession = { id: 'FAM-7X4M2Q', joinCode: '274 961', privateKey: 'kv_demo_f84b7c229', name: 'Sharma Family', guardianName: 'Aarav', eventName: mapConfig.eventName, safetyRadius: 50, durationHours: 8, emergencyContact: '+91 98765 43210', startedAt: started, trackingPaused: false };

export const demoNarration = [
  'Everyone is close and updating around Ramkund.',
  'Arya starts moving through the riverfront crowd.',
  'Arya enters the early-warning band.',
  'Arya crosses 65m; the eight-second grace period begins.',
  'The grace period expires and a separation alert opens.',
  'Arya raises SOS from the simulated band.',
  'The guardian starts private Reunion Mode.',
  'Both positions converge on the reunion point.',
  'Arya enters the 15m reunion radius.',
];

const stepLocations = [
  [20.00568, 73.79386], [20.00592, 73.79370], [20.00603, 73.79370], [20.00622, 73.79362],
  [20.00642, 73.79348], [20.00642, 73.79348], [20.00642, 73.79348], [20.00591, 73.79382], [20.00561, 73.79410],
] as const;

const activity = (message: string, type = 'system'): ActivityEvent => ({ id: crypto.randomUUID(), at: Date.now(), type, message });
const asUiMember = (member: ReturnType<typeof deriveFamily>[number]): FamilyMember => ({ ...member, distance: member.distanceMetres, lastHeartbeat: member.lastHeartbeatAt, position: { ...member.location, at: member.location.recordedAt }, trail: member.trail.map((sample) => ({ ...sample, at: sample.recordedAt })) });
const asUiAlert = (alert: SafetyAlert): AlertRecord => ({ id: alert.id, memberId: alert.memberId, at: alert.openedAt, kind: alert.kind, resolved: Boolean(alert.resolvedAt), message: alert.kind === 'sos' ? 'Emergency help requested from this device.' : alert.kind === 'offline' ? 'Device updates are stale or sharing is paused.' : 'Member remained beyond the 65m boundary after the grace period.' });

interface AppState {
  page: Page; opening: boolean; session: FamilySession | null; rawMembers: RawMember[]; members: FamilyMember[]; rawAlerts: SafetyAlert[]; alerts: AlertRecord[]; activity: ActivityEvent[];
  selectedMemberId: string | null; demoStep: number; demoPlaying: boolean; presentationMode: boolean; reunionMemberId?: string; reunionActive: boolean; bluetoothConnected: boolean; serverUrl: string; mapMode: 'offline' | 'real';
  setPage(page: Page): void; dismissOpening(): void; createSession(input: Omit<FamilySession, 'id' | 'joinCode' | 'privateKey' | 'startedAt' | 'trackingPaused'>): void;
  startDemo(): void; setDemoStep(step: number): void; setDemoPlaying(value: boolean): void; resetDemo(): void; setPresentationMode(value: boolean): void; selectMember(id: string | null): void;
  setBluetoothConnected(value: boolean): void; addSimulatedBand(): void; addActivity(message: string, type?: string): void; acknowledge(memberId: string): void; resolveAlert(memberId: string): void;
  startReunion(memberId: string): void; toggleSharing(): void; endSession(): void; setServerUrl(url: string): void; setMapMode(mode: 'offline' | 'real'): void; updateGuardianLocation(lat: number, lng: number, accuracy: number): void;
}

function compute(rawMembers: RawMember[], now: number, previousAlerts: SafetyAlert[], reunionMemberId?: string) {
  const guardian = rawMembers.find((member) => member.id === GUARDIAN_ID);
  const timestamped = guardian ? rawMembers.map((member) => member.id === GUARDIAN_ID ? member : withBoundaryTimestamp(member, guardian.location, now)) : rawMembers;
  const derived = deriveFamily(timestamped, GUARDIAN_ID, now, reunionMemberId);
  const rawAlerts = reconcileAlerts(previousAlerts, derived, now);
  return { rawMembers: timestamped, members: derived.map(asUiMember), rawAlerts, alerts: rawAlerts.map(asUiAlert) };
}

export const useAppStore = create<AppState>((set, get) => ({
  page: 'home', opening: true, session: null, rawMembers: [], members: [], rawAlerts: [], alerts: [], activity: [], selectedMemberId: null,
  demoStep: 0, demoPlaying: false, presentationMode: false, reunionActive: false, bluetoothConnected: false, serverUrl: '', mapMode: 'real',
  setPage: (page) => set({ page }),
  dismissOpening: () => set({ opening: false }),
  createSession: (input) => {
    const session = { ...input, id: `FAM-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, joinCode: String(Math.floor(100000 + Math.random() * 900000)).replace(/(\d{3})(\d{3})/, '$1 $2'), privateKey: `kv_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`, startedAt: Date.now(), trackingPaused: false };
    const rawMembers = seededMembers();
    set({ session, opening: false, page: 'home', activity: [activity(`${input.name} private session created`, 'family')], ...compute(rawMembers, Date.now(), []) });
  },
  startDemo: () => { const rawMembers = seededMembers(); set({ opening: false, session: seededSession, page: 'map', demoStep: 0, demoPlaying: false, reunionActive: false, reunionMemberId: undefined, activity: [activity('Jury demo session started', 'demo')], ...compute(rawMembers, Date.now(), []) }); },
  setDemoStep: (requested) => set((state) => {
    const step = Math.max(0, Math.min(8, requested));
    const now = Date.now();
    const [lat, lng] = stepLocations[step];
    const rawMembers = state.rawMembers.map((member) => member.id !== 'band-02' ? { ...member, lastHeartbeatAt: now } : {
      ...member,
      trail: [...member.trail, member.location].slice(-12),
      location: location(lat, lng, now, step === 3 ? 16 : 6),
      lastHeartbeatAt: now,
      sosActive: step === 5,
      crossedBoundaryAt: step >= 4 && step <= 7 ? now - 8_100 : step === 3 ? now : undefined,
    });
    const reunionMemberId = step >= 6 ? 'band-02' : undefined;
    const result = compute(rawMembers, now, step === 0 ? [] : state.rawAlerts, reunionMemberId);
    const nextActivity = step === state.demoStep ? state.activity : [...state.activity, activity(demoNarration[step], 'demo')];
    return { demoStep: step, reunionMemberId, reunionActive: step >= 6 && step < 8, activity: nextActivity, ...result };
  }),
  setDemoPlaying: (demoPlaying) => set({ demoPlaying }),
  resetDemo: () => get().startDemo(),
  setPresentationMode: (presentationMode) => set({ presentationMode }),
  selectMember: (selectedMemberId) => set({ selectedMemberId }),
  setBluetoothConnected: (bluetoothConnected) => set({ bluetoothConnected }),
  addSimulatedBand: () => set((state) => {
    const now = Date.now(); const guardian = state.rawMembers.find((m) => m.id === GUARDIAN_ID)?.location ?? baseLocations.guardian;
    const newMember: RawMember = { id: crypto.randomUUID(), name: 'New member', relation: 'Family', deviceName: `Smart Mauli Band ${String(state.rawMembers.filter((m) => m.deviceKind === 'band').length + 1).padStart(2, '0')}`, deviceKind: 'band', reality: 'simulated', battery: 86, connection: 'Simulated', lastHeartbeatAt: now, locationSharing: true, sosActive: false, location: { ...guardian, recordedAt: now }, trail: [] };
    return { activity: [...state.activity, activity('Simulated Smart Mauli Band added', 'device')], ...compute([...state.rawMembers, newMember], now, state.rawAlerts, state.reunionMemberId) };
  }),
  addActivity: (message, type) => set((state) => ({ activity: [...state.activity, activity(message, type)] })),
  acknowledge: (memberId) => set((state) => ({ activity: [...state.activity, activity(`Guardian acknowledged ${memberId}`, 'alert')] })),
  resolveAlert: (memberId) => set((state) => ({ activity: [...state.activity, activity(`Conditions for ${memberId} must return to normal before the alert resolves.`, 'alert')] })),
  startReunion: (memberId) => set((state) => ({ reunionMemberId: memberId, reunionActive: true, selectedMemberId: memberId, page: 'map', activity: [...state.activity, activity('Reunion mode started', 'reunion')], ...compute(state.rawMembers, Date.now(), state.rawAlerts, memberId) })),
  toggleSharing: () => set((state) => {
    if (!state.session) return {};
    const trackingPaused = !state.session.trackingPaused;
    const rawMembers = state.rawMembers.map((member) => member.id === GUARDIAN_ID ? { ...member, locationSharing: !trackingPaused } : member);
    return { session: { ...state.session, trackingPaused }, activity: [...state.activity, activity(trackingPaused ? 'Location sharing paused' : 'Location sharing resumed', 'privacy')], ...compute(rawMembers, Date.now(), state.rawAlerts, state.reunionMemberId) };
  }),
  endSession: () => set({ session: null, rawMembers: [], members: [], rawAlerts: [], alerts: [], activity: [], opening: true, page: 'home' }),
  setServerUrl: (serverUrl) => set({ serverUrl }), setMapMode: (mapMode) => set({ mapMode }),
  updateGuardianLocation: (lat, lng, accuracy) => set((state) => {
    const now = Date.now(); const rawMembers = state.rawMembers.map((member) => member.id === GUARDIAN_ID ? { ...member, lastHeartbeatAt: now, location: location(lat, lng, now, accuracy), trail: [...member.trail, member.location].slice(-12) } : member);
    return { activity: [...state.activity, activity(`Phone location updated with ±${Math.round(accuracy)}m accuracy`, 'location')], ...compute(rawMembers, now, state.rawAlerts, state.reunionMemberId) };
  }),
}));
