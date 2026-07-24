import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mapConfig } from '@/config/mapConfig';
import {
  calculateDistanceMeters,
  offsetCoordinate,
} from '@/domain/safety/calculateDistance';
import {
  deriveFamilyState,
  withBoundaryTimestamp,
  type ReunionContext,
} from '@/domain/safety/deriveFamilyState';
import {
  migrateSafetyConfig,
  recommendedSafetyConfig,
  updateSafetyConfig,
  type SafetyConfig,
} from '@/domain/safety/safetyConfig';
import { reconcileAlerts } from '@/services/alertEngine';
import { buildSimulationScenario } from '@/features/simulation/simulationScenario';
import type { SimulationSpeed } from '@/features/simulation/simulationTypes';
import type {
  ActivityEvent,
  AlertRecord,
  FamilyMember,
  FamilySession,
} from '@/types/domain';
import type { LocationSample, RawMember, SafetyAlert } from '@/types/safety';

export type Page = 'home' | 'map' | 'family' | 'alerts' | 'simulation' | 'settings';
export type ReunionProgress =
  | 'not-started'
  | 'choosing-point'
  | 'guardian-moving'
  | 'member-moving'
  | 'both-approaching'
  | 'inside-range'
  | 'verifying'
  | 'reunited';

const GUARDIAN_ID = 'guardian-phone';
const DEFAULT_DEMO_MEMBER_ID = 'band-02';
const started = Date.now();
const location = (
  lat: number,
  lng: number,
  at = started,
  accuracy = 5,
): LocationSample => ({ lat, lng, accuracy, recordedAt: at });
const eventCentre = location(mapConfig.center[1], mapConfig.center[0]);

export const offsetFromEventCentre = (eastMeters: number, northMeters: number) => {
  const coordinate = offsetCoordinate(eventCentre, eastMeters, northMeters);
  return location(coordinate.lat, coordinate.lng);
};

const baseLocations = {
  guardian: offsetFromEventCentre(0, 0),
  aditya: offsetFromEventCentre(18, 18),
  himank: offsetFromEventCentre(-28, -30),
  arya: offsetFromEventCentre(-32, 23),
};

export const seededMembers = (): RawMember[] => [
  { id: GUARDIAN_ID, name: 'Ashwin Gudur', relation: 'Team Lead · TY-AIA-47', deviceName: "Ashwin's Phone", deviceKind: 'phone', reality: 'phone', battery: 92, connection: 'Local Wi-Fi', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.guardian, trail: [] },
  { id: 'member-phone', name: 'Aditya Gholap', relation: 'Team Member · TY-CC2-61', deviceName: "Aditya's Phone", deviceKind: 'phone', reality: 'simulated', battery: 78, connection: 'WebSocket', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.aditya, trail: [] },
  { id: 'band-01', name: 'Himank Maheshwari', relation: 'Team Member · TY-AIA-49', deviceName: 'Smart Mauli Band 01', deviceKind: 'band', reality: 'simulated', battery: 84, connection: 'Bluetooth', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.himank, trail: [] },
  { id: DEFAULT_DEMO_MEMBER_ID, name: 'Arya Dhumal', relation: 'Team Member · TY-CC2-64', deviceName: 'Smart Mauli Band 02', deviceKind: 'band', reality: 'simulated', battery: 71, connection: 'Bluetooth', lastHeartbeatAt: Date.now(), locationSharing: true, sosActive: false, location: baseLocations.arya, trail: [] },
];

const seededSession: FamilySession = {
  id: 'FAM-7X4M2Q',
  joinCode: '274 961',
  privateKey: 'kv_demo_f84b7c229',
  name: 'Kumbh Kavach Team',
  guardianName: 'Ashwin',
  eventName: mapConfig.eventName,
  safetyRadius: recommendedSafetyConfig.safeRadiusMeters,
  durationHours: 8,
  emergencyContact: '+91 98765 43210',
  startedAt: started,
  trackingPaused: false,
};

export const demoNarration = buildSimulationScenario(
  recommendedSafetyConfig,
  baseLocations.guardian,
  started,
).map((step) => step.narration);

const activity = (message: string, type = 'system'): ActivityEvent => ({
  id: crypto.randomUUID(),
  at: Date.now(),
  type,
  message,
});
const asUiMember = (
  member: ReturnType<typeof deriveFamilyState>[number],
): FamilyMember => ({
  ...member,
  distance: member.distanceMetres,
  lastHeartbeat: member.lastHeartbeatAt,
  position: { ...member.location, at: member.location.recordedAt },
  trail: member.trail.map((sample) => ({ ...sample, at: sample.recordedAt })),
});
const asUiAlert = (alert: SafetyAlert): AlertRecord => ({
  id: alert.id,
  memberId: alert.memberId,
  at: alert.openedAt,
  kind: alert.kind,
  resolved: Boolean(alert.resolvedAt),
  message: alert.kind === 'sos'
    ? 'Emergency help requested from this device.'
    : alert.kind === 'offline'
      ? 'Device updates are stale or sharing is paused.'
      : 'Member remained beyond the configured safety boundary after the grace period.',
});

interface AppState {
  page: Page;
  opening: boolean;
  session: FamilySession | null;
  rawMembers: RawMember[];
  members: FamilyMember[];
  rawAlerts: SafetyAlert[];
  alerts: AlertRecord[];
  activity: ActivityEvent[];
  selectedMemberId: string | null;
  safetyConfig: SafetyConfig;
  safetyConfigError?: string;
  demoStep: number;
  demoPlaying: boolean;
  demoSpeed: SimulationSpeed;
  demoMemberId: string;
  randomMovement: boolean;
  presentationMode: boolean;
  reunionMemberId?: string;
  reunionActive: boolean;
  reunionEligibleIds: string[];
  reunionConfirmedIds: string[];
  reunionInsideSince: Record<string, number>;
  reunionPoint: LocationSample;
  reunionPointSource: 'guardian' | 'custom';
  reunionProgress: ReunionProgress;
  acknowledgedSosIds: string[];
  bluetoothConnected: boolean;
  serverUrl: string;
  mapMode: 'offline' | 'real';
  setPage(page: Page): void;
  dismissOpening(): void;
  createSession(input: Omit<FamilySession, 'id' | 'joinCode' | 'privateKey' | 'startedAt' | 'trackingPaused'>): void;
  startDemo(): void;
  setDemoStep(step: number): void;
  setDemoPlaying(value: boolean): void;
  setDemoSpeed(value: SimulationSpeed): void;
  setDemoMember(id: string): void;
  resetDemo(): void;
  resetAllDemo(): void;
  setPresentationMode(value: boolean): void;
  selectMember(id: string | null): void;
  updateSafety(patch: Partial<SafetyConfig>): boolean;
  resetSafety(): void;
  setReunionPoint(lat: number, lng: number): void;
  useGuardianAsReunionPoint(): void;
  setBluetoothConnected(value: boolean): void;
  addSimulatedBand(): void;
  addActivity(message: string, type?: string): void;
  acknowledge(memberId: string): void;
  resolveAlert(memberId: string): void;
  startReunion(memberId: string): void;
  confirmReunion(memberId: string): void;
  restoreMember(memberId: string): void;
  moveDemoMember(direction: 'away' | 'closer'): void;
  triggerDemoSos(): void;
  triggerGuardianSos(): void;
  cancelDemoSos(): void;
  setDemoConnection(connected: boolean): void;
  setDemoHeartbeat(stale: boolean): void;
  changeDemoBattery(delta: number): void;
  moveGuardianTowardReunion(): void;
  completeDemoReunion(): void;
  setRandomMovement(value: boolean): void;
  toggleSharing(): void;
  endSession(): void;
  setServerUrl(url: string): void;
  setMapMode(mode: 'offline' | 'real'): void;
  updateGuardianLocation(lat: number, lng: number, accuracy: number): void;
  clearApplicationCaches(): Promise<void>;
}

const reunionContext = (
  state: Pick<AppState, 'reunionMemberId' | 'reunionEligibleIds' | 'reunionConfirmedIds' | 'reunionPoint' | 'reunionInsideSince'>,
): ReunionContext => ({
  memberId: state.reunionMemberId,
  eligibleMemberIds: state.reunionEligibleIds,
  confirmedMemberIds: state.reunionConfirmedIds,
  point: state.reunionPoint,
  insideSinceByMember: state.reunionInsideSince,
});

function compute(
  rawMembers: RawMember[],
  now: number,
  previousAlerts: SafetyAlert[],
  config: SafetyConfig,
  reunion: ReunionContext = {},
) {
  const guardian = rawMembers.find((member) => member.id === GUARDIAN_ID);
  const timestamped = guardian
    ? rawMembers.map((member) => member.id === GUARDIAN_ID
      ? member
      : withBoundaryTimestamp(member, guardian.location, now, config))
    : rawMembers;
  const derived = deriveFamilyState(timestamped, GUARDIAN_ID, now, config, reunion);
  const rawAlerts = reconcileAlerts(previousAlerts, derived, now);
  return {
    rawMembers: timestamped,
    members: derived.map(asUiMember),
    rawAlerts,
    alerts: rawAlerts.map(asUiAlert),
  };
}

function mutateMember(
  state: AppState,
  memberId: string,
  message: string,
  mutate: (member: RawMember, now: number) => RawMember,
) {
  const now = Date.now();
  const rawMembers = state.rawMembers.map((member) =>
    member.id === memberId ? mutate(member, now) : member);
  return {
    activity: [...state.activity, activity(message, 'demo')],
    ...compute(
      rawMembers,
      now,
      state.rawAlerts,
      state.safetyConfig,
      reunionContext(state),
    ),
  };
}

const initialConfig = recommendedSafetyConfig;

export const useAppStore = create<AppState>()(persist((set, get) => ({
  page: 'home',
  opening: true,
  session: null,
  rawMembers: [],
  members: [],
  rawAlerts: [],
  alerts: [],
  activity: [],
  selectedMemberId: null,
  safetyConfig: initialConfig,
  demoStep: 0,
  demoPlaying: false,
  demoSpeed: 1,
  demoMemberId: DEFAULT_DEMO_MEMBER_ID,
  randomMovement: false,
  presentationMode: false,
  reunionActive: false,
  reunionEligibleIds: [],
  reunionConfirmedIds: [],
  reunionInsideSince: {},
  reunionPoint: baseLocations.guardian,
  reunionPointSource: 'guardian',
  reunionProgress: 'not-started',
  acknowledgedSosIds: [],
  bluetoothConnected: false,
  serverUrl: '',
  mapMode: 'real',
  setPage: (page) => set({ page }),
  dismissOpening: () => set({ opening: false }),
  createSession: (input) => {
    const config = get().safetyConfig;
    const session = {
      ...input,
      safetyRadius: config.safeRadiusMeters,
      id: `FAM-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      joinCode: String(Math.floor(100000 + Math.random() * 900000))
        .replace(/(\d{3})(\d{3})/, '$1 $2'),
      privateKey: `kv_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`,
      startedAt: Date.now(),
      trackingPaused: false,
    };
    const rawMembers = seededMembers();
    set({
      session,
      opening: false,
      page: 'home',
      reunionEligibleIds: [],
      reunionConfirmedIds: [],
      reunionInsideSince: {},
      acknowledgedSosIds: [],
      activity: [activity(`${input.name} private session created`, 'family')],
      ...compute(rawMembers, Date.now(), [], config),
    });
  },
  startDemo: () => {
    const safetyConfig = get().safetyConfig;
    const rawMembers = seededMembers();
    set({
      opening: false,
      session: { ...seededSession, safetyRadius: safetyConfig.safeRadiusMeters },
      page: 'map',
      demoStep: 0,
      demoPlaying: false,
      reunionActive: false,
      reunionMemberId: undefined,
      reunionEligibleIds: [],
      reunionConfirmedIds: [],
      reunionInsideSince: {},
      reunionPoint: rawMembers[0].location,
      reunionPointSource: 'guardian',
      reunionProgress: 'not-started',
      acknowledgedSosIds: [],
      activity: [activity('Jury demo session started with deterministic seed 20260724', 'demo')],
      ...compute(rawMembers, Date.now(), [], safetyConfig),
    });
    get().setDemoStep(0);
  },
  setDemoStep: (requested) => set((state) => {
    const step = Math.max(0, Math.min(8, requested));
    const now = Date.now();
    const guardian = state.rawMembers.find((member) => member.id === GUARDIAN_ID)
      ?.location ?? baseLocations.guardian;
    const scenario = buildSimulationScenario(state.safetyConfig, guardian, now);
    const frame = scenario[step];
    const rawMembers = state.rawMembers.map((member) =>
      member.id !== state.demoMemberId
        ? { ...member, lastHeartbeatAt: now }
        : {
          ...member,
          trail: [...member.trail, member.location].slice(-20),
          location: frame.location,
          lastHeartbeatAt: now,
          locationSharing: true,
          sosActive: frame.sosActive,
          crossedBoundaryAt: frame.crossedBoundaryAt,
        });
    const reunionMemberId = frame.reunionActive ? state.demoMemberId : undefined;
    const reunionEligibleIds = frame.reunionEligible ? [state.demoMemberId] : [];
    const reunionInsideSince = step === 8
      ? { [state.demoMemberId]: now - state.safetyConfig.reunionStableSeconds * 1000 }
      : {};
    const result = compute(rawMembers, now, step === 0 ? [] : state.rawAlerts, state.safetyConfig, {
      memberId: reunionMemberId,
      eligibleMemberIds: reunionEligibleIds,
      confirmedMemberIds: [],
      point: state.reunionPoint,
      insideSinceByMember: reunionInsideSince,
    });
    return {
      demoStep: step,
      reunionMemberId,
      reunionEligibleIds,
      reunionConfirmedIds: [],
      reunionInsideSince,
      reunionActive: frame.reunionActive,
      reunionProgress: !frame.reunionActive
        ? 'not-started'
        : step === 6
          ? 'choosing-point'
          : step === 7
            ? 'both-approaching'
            : 'verifying',
      activity: step === state.demoStep
        ? state.activity
        : [...state.activity, activity(frame.narration, 'demo')],
      ...result,
    };
  }),
  setDemoPlaying: (demoPlaying) => set({ demoPlaying }),
  setDemoSpeed: (demoSpeed) => set({ demoSpeed }),
  setDemoMember: (demoMemberId) => set({ demoMemberId, selectedMemberId: demoMemberId }),
  resetDemo: () => get().startDemo(),
  resetAllDemo: () => {
    set({
      safetyConfig: recommendedSafetyConfig,
      demoSpeed: 1,
      randomMovement: false,
    });
    get().startDemo();
  },
  setPresentationMode: (presentationMode) => set({ presentationMode }),
  selectMember: (selectedMemberId) => set({ selectedMemberId }),
  updateSafety: (patch) => {
    const state = get();
    const result = updateSafetyConfig(state.safetyConfig, patch);
    if (!result.success) {
      set({ safetyConfigError: result.message });
      return false;
    }
    const safetyConfig = result.value;
    const session = state.session
      ? { ...state.session, safetyRadius: safetyConfig.safeRadiusMeters }
      : null;
    set({
      safetyConfig,
      safetyConfigError: undefined,
      session,
      activity: [...state.activity, activity(
        `Safety ranges updated: ${safetyConfig.safeRadiusMeters}m safe · ${safetyConfig.reunionRadiusMeters}m reunion`,
        'settings',
      )],
      ...compute(
        state.rawMembers,
        Date.now(),
        state.rawAlerts,
        safetyConfig,
        reunionContext(state),
      ),
    });
    return true;
  },
  resetSafety: () => { get().updateSafety(recommendedSafetyConfig); },
  setReunionPoint: (lat, lng) => set((state) => {
    const reunionPoint = location(lat, lng, Date.now(), 5);
    return {
      reunionPoint,
      reunionPointSource: 'custom',
      reunionProgress: state.reunionActive ? 'both-approaching' : 'choosing-point',
      activity: [...state.activity, activity('Custom reunion point selected on the map', 'reunion')],
      ...compute(state.rawMembers, Date.now(), state.rawAlerts, state.safetyConfig, {
        ...reunionContext(state),
        point: reunionPoint,
      }),
    };
  }),
  useGuardianAsReunionPoint: () => set((state) => {
    const reunionPoint = state.rawMembers.find((member) => member.id === GUARDIAN_ID)
      ?.location ?? baseLocations.guardian;
    return {
      reunionPoint,
      reunionPointSource: 'guardian',
      activity: [...state.activity, activity('Guardian location set as reunion point', 'reunion')],
    };
  }),
  setBluetoothConnected: (bluetoothConnected) => set({ bluetoothConnected }),
  addSimulatedBand: () => set((state) => {
    const now = Date.now();
    const guardian = state.rawMembers.find((member) => member.id === GUARDIAN_ID)
      ?.location ?? baseLocations.guardian;
    const newMember: RawMember = {
      id: crypto.randomUUID(),
      name: 'New member',
      relation: 'Family',
      deviceName: `Smart Mauli Band ${String(
        state.rawMembers.filter((member) => member.deviceKind === 'band').length + 1,
      ).padStart(2, '0')}`,
      deviceKind: 'band',
      reality: 'simulated',
      battery: 86,
      connection: 'Simulated',
      lastHeartbeatAt: now,
      locationSharing: true,
      sosActive: false,
      location: { ...guardian, recordedAt: now },
      trail: [],
    };
    return {
      activity: [...state.activity, activity('Simulated Smart Mauli Band added', 'device')],
      ...compute(
        [...state.rawMembers, newMember],
        now,
        state.rawAlerts,
        state.safetyConfig,
        reunionContext(state),
      ),
    };
  }),
  addActivity: (message, type) => set((state) => ({
    activity: [...state.activity, activity(message, type)],
  })),
  acknowledge: (memberId) => set((state) => ({
    acknowledgedSosIds: state.acknowledgedSosIds.includes(memberId)
      ? state.acknowledgedSosIds
      : [...state.acknowledgedSosIds, memberId],
    activity: [...state.activity, activity(`Guardian acknowledged SOS from ${memberId}`, 'alert')],
  })),
  resolveAlert: (memberId) => set((state) => {
    if (!state.acknowledgedSosIds.includes(memberId)) {
      return {
        activity: [...state.activity, activity('Acknowledge the SOS before resolving it.', 'alert')],
      };
    }
    return mutateMember(
      state,
      memberId,
      `SOS from ${memberId} resolved by guardian`,
      (member, now) => ({ ...member, sosActive: false, lastHeartbeatAt: now }),
    );
  }),
  startReunion: (memberId) => set((state) => {
    const current = state.members.find((member) => member.id === memberId);
    const wasUnsafe = current && ['warning', 'separated', 'sos'].includes(current.status);
    const reunionEligibleIds = wasUnsafe && !state.reunionEligibleIds.includes(memberId)
      ? [...state.reunionEligibleIds, memberId]
      : state.reunionEligibleIds;
    return {
      reunionMemberId: memberId,
      reunionActive: true,
      reunionEligibleIds,
      reunionProgress: 'choosing-point',
      selectedMemberId: memberId,
      page: 'map',
      activity: [...state.activity, activity(
        'Reunion Mode started; stable proximity and guardian confirmation are required.',
        'reunion',
      )],
      ...compute(state.rawMembers, Date.now(), state.rawAlerts, state.safetyConfig, {
        ...reunionContext(state),
        memberId,
        eligibleMemberIds: reunionEligibleIds,
      }),
    };
  }),
  confirmReunion: (memberId) => set((state) => {
    if (!state.reunionEligibleIds.includes(memberId)) {
      return {
        activity: [...state.activity, activity(
          'Reunion requires a prior warning, separation, or SOS.',
          'reunion',
        )],
      };
    }
    const member = state.members.find((item) => item.id === memberId);
    if (!member || member.reunionDistanceMetres > state.safetyConfig.reunionRadiusMeters) {
      return {
        activity: [...state.activity, activity(
          'Member must be inside the reunion radius before confirmation.',
          'reunion',
        )],
      };
    }
    const insideSince = state.reunionInsideSince[memberId] ?? Date.now();
    const stable = Date.now() - insideSince >= state.safetyConfig.reunionStableSeconds * 1000;
    if (!stable) {
      return {
        reunionInsideSince: { ...state.reunionInsideSince, [memberId]: insideSince },
        reunionProgress: 'verifying',
        activity: [...state.activity, activity('Verifying stable reunion proximity…', 'reunion')],
      };
    }
    const confirmedMemberIds = state.reunionConfirmedIds.includes(memberId)
      ? state.reunionConfirmedIds
      : [...state.reunionConfirmedIds, memberId];
    return {
      reunionConfirmedIds: confirmedMemberIds,
      reunionProgress: 'reunited',
      activity: [...state.activity, activity(
        'Simulated/manual reunion confirmed after the stable-time check.',
        'reunion',
      )],
      ...compute(state.rawMembers, Date.now(), state.rawAlerts, state.safetyConfig, {
        ...reunionContext(state),
        confirmedMemberIds,
        insideSinceByMember: { ...state.reunionInsideSince, [memberId]: insideSince },
      }),
    };
  }),
  restoreMember: (memberId) => set((state) => {
    const guardian = state.rawMembers.find((member) => member.id === GUARDIAN_ID)
      ?.location ?? baseLocations.guardian;
    return mutateMember(state, memberId, `${memberId} restored to guardian`, (member, now) => ({
      ...member,
      sosActive: false,
      crossedBoundaryAt: undefined,
      lastHeartbeatAt: now,
      locationSharing: true,
      location: { ...guardian, recordedAt: now },
    }));
  }),
  moveDemoMember: (direction) => set((state) => {
    const guardian = state.rawMembers.find((member) => member.id === GUARDIAN_ID)
      ?.location ?? baseLocations.guardian;
    const target = state.rawMembers.find((member) => member.id === state.demoMemberId);
    if (!target) return {};
    const current = calculateDistanceMeters(guardian, target.location);
    const delta = Math.max(5, state.safetyConfig.safeRadiusMeters * 0.2);
    const nextDistance = direction === 'away'
      ? current + delta
      : Math.max(0, current - delta);
    const coordinate = offsetCoordinate(guardian, -nextDistance * 0.72, nextDistance * 0.69);
    return mutateMember(
      state,
      state.demoMemberId,
      `${target.name} moved ${direction}`,
      (member, now) => ({
        ...member,
        location: location(coordinate.lat, coordinate.lng, now, 5),
        lastHeartbeatAt: now,
        trail: [...member.trail, member.location].slice(-20),
      }),
    );
  }),
  triggerDemoSos: () => set((state) => mutateMember(
    state,
    state.demoMemberId,
    'Simulated SOS triggered',
    (member, now) => ({ ...member, sosActive: true, lastHeartbeatAt: now }),
  )),
  triggerGuardianSos: () => set((state) => {
    const guardianId = state.rawMembers.find((member) => member.deviceKind === 'phone')?.id;
    if (!guardianId) return state;
    return mutateMember(
      state,
      guardianId,
      'Guardian phone SOS triggered',
      (member, now) => ({ ...member, sosActive: true, lastHeartbeatAt: now }),
    );
  }),
  cancelDemoSos: () => set((state) => mutateMember(
    state,
    state.demoMemberId,
    'Simulated SOS cancelled',
    (member, now) => ({ ...member, sosActive: false, lastHeartbeatAt: now }),
  )),
  setDemoConnection: (connected) => set((state) => mutateMember(
    state,
    state.demoMemberId,
    connected ? 'Demo connection restored' : 'Demo connection lost',
    (member, now) => ({
      ...member,
      locationSharing: connected,
      lastHeartbeatAt: connected ? now : member.lastHeartbeatAt,
    }),
  )),
  setDemoHeartbeat: (stale) => set((state) => mutateMember(
    state,
    state.demoMemberId,
    stale ? 'Demo heartbeat made stale' : 'Demo heartbeat refreshed',
    (member, now) => ({
      ...member,
      lastHeartbeatAt: stale
        ? now - state.safetyConfig.staleTimeoutSeconds * 1000 - 1
        : now,
      locationSharing: true,
    }),
  )),
  changeDemoBattery: (delta) => set((state) => mutateMember(
    state,
    state.demoMemberId,
    delta < 0 ? 'Demo battery drained' : 'Demo battery restored',
    (member) => ({ ...member, battery: Math.max(0, Math.min(100, member.battery + delta)) }),
  )),
  moveGuardianTowardReunion: () => set((state) => {
    const guardian = state.rawMembers.find((member) => member.id === GUARDIAN_ID);
    if (!guardian) return {};
    const halfway = {
      lat: (guardian.location.lat + state.reunionPoint.lat) / 2,
      lng: (guardian.location.lng + state.reunionPoint.lng) / 2,
    };
    return {
      reunionProgress: 'guardian-moving',
      ...mutateMember(state, GUARDIAN_ID, 'Guardian moved toward reunion point', (member, now) => ({
        ...member,
        location: location(halfway.lat, halfway.lng, now, 5),
        lastHeartbeatAt: now,
      })),
    };
  }),
  completeDemoReunion: () => {
    const state = get();
    const coordinate = offsetCoordinate(
      state.reunionPoint,
      state.safetyConfig.reunionRadiusMeters * 0.25,
      0,
    );
    const now = Date.now();
    const rawMembers = state.rawMembers.map((member) =>
      member.id === state.demoMemberId
        ? {
          ...member,
          sosActive: false,
          locationSharing: true,
          lastHeartbeatAt: now,
          crossedBoundaryAt: undefined,
          location: location(coordinate.lat, coordinate.lng, now, 4),
        }
        : member);
    set({
      reunionInsideSince: {
        ...state.reunionInsideSince,
        [state.demoMemberId]: now - state.safetyConfig.reunionStableSeconds * 1000,
      },
      reunionProgress: 'inside-range',
      activity: [...state.activity, activity('Both simulated users entered reunion range', 'reunion')],
      ...compute(rawMembers, now, state.rawAlerts, state.safetyConfig, {
        ...reunionContext(state),
        memberId: state.demoMemberId,
        eligibleMemberIds: [state.demoMemberId],
        insideSinceByMember: {
          ...state.reunionInsideSince,
          [state.demoMemberId]: now - state.safetyConfig.reunionStableSeconds * 1000,
        },
      }),
    });
  },
  setRandomMovement: (randomMovement) => set((state) => ({
    randomMovement,
    activity: [...state.activity, activity(
      `Seeded random movement ${randomMovement ? 'enabled' : 'disabled'}`,
      'demo',
    )],
  })),
  toggleSharing: () => set((state) => {
    if (!state.session) return {};
    const trackingPaused = !state.session.trackingPaused;
    const rawMembers = state.rawMembers.map((member) =>
      member.id === GUARDIAN_ID
        ? { ...member, locationSharing: !trackingPaused }
        : member);
    return {
      session: { ...state.session, trackingPaused },
      activity: [...state.activity, activity(
        trackingPaused ? 'Location sharing paused' : 'Location sharing resumed',
        'privacy',
      )],
      ...compute(
        rawMembers,
        Date.now(),
        state.rawAlerts,
        state.safetyConfig,
        reunionContext(state),
      ),
    };
  }),
  endSession: () => set({
    session: null,
    rawMembers: [],
    members: [],
    rawAlerts: [],
    alerts: [],
    activity: [],
    opening: true,
    page: 'home',
  }),
  setServerUrl: (serverUrl) => set({ serverUrl }),
  setMapMode: (mapMode) => set({ mapMode }),
  updateGuardianLocation: (lat, lng, accuracy) => set((state) => {
    const now = Date.now();
    const rawMembers = state.rawMembers.map((member) =>
      member.id === GUARDIAN_ID
        ? {
          ...member,
          lastHeartbeatAt: now,
          location: location(lat, lng, now, accuracy),
          trail: [...member.trail, member.location].slice(-20),
        }
        : member);
    const reunionPoint = state.reunionPointSource === 'guardian'
      ? location(lat, lng, now, accuracy)
      : state.reunionPoint;
    return {
      reunionPoint,
      activity: [...state.activity, activity(
        `Phone location updated with ±${Math.round(accuracy)}m accuracy`,
        'location',
      )],
      ...compute(rawMembers, now, state.rawAlerts, state.safetyConfig, {
        ...reunionContext(state),
        point: reunionPoint,
      }),
    };
  }),
  clearApplicationCaches: async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    localStorage.removeItem('kumbh-kavach-state');
    get().resetAllDemo();
  },
}), {
  name: 'kumbh-kavach-state',
  version: 2,
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    page: state.page,
    opening: state.opening,
    session: state.session,
    rawMembers: state.rawMembers,
    members: state.members,
    rawAlerts: state.rawAlerts,
    alerts: state.alerts,
    activity: state.activity,
    selectedMemberId: state.selectedMemberId,
    safetyConfig: state.safetyConfig,
    demoStep: state.demoStep,
    demoSpeed: state.demoSpeed,
    demoMemberId: state.demoMemberId,
    reunionMemberId: state.reunionMemberId,
    reunionActive: state.reunionActive,
    reunionEligibleIds: state.reunionEligibleIds,
    reunionConfirmedIds: state.reunionConfirmedIds,
    reunionInsideSince: state.reunionInsideSince,
    reunionPoint: state.reunionPoint,
    reunionPointSource: state.reunionPointSource,
    reunionProgress: state.reunionProgress,
    acknowledgedSosIds: state.acknowledgedSosIds,
    mapMode: state.mapMode,
  }),
  migrate: (persisted) => {
    const state = persisted as Partial<AppState> & { safetyConfig?: unknown };
    return { ...state, safetyConfig: migrateSafetyConfig(state.safetyConfig) };
  },
}));
