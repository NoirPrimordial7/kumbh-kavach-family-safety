import {
  BatteryCharging,
  BatteryLow,
  HeartPulse,
  MapPin,
  MoveDown,
  MoveUp,
  Radio,
  RefreshCcw,
  ShieldAlert,
  Signal,
  SignalZero,
} from 'lucide-react';
import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function SimulationControls() {
  const familyMembers = useAppStore((state) => state.members);
  const members = useMemo(
    () => familyMembers.filter((member) => member.reality === 'simulated'),
    [familyMembers],
  );
  const selectedId = useAppStore((state) => state.demoMemberId);
  const random = useAppStore((state) => state.randomMovement);

  return <div className="simulation-controls-drawer" aria-label="Simulation controls">
    <label>
      Simulated member
      <select
        value={selectedId}
        onChange={(event) => useAppStore.getState().setDemoMember(event.target.value)}
      >
        {members.map((member) =>
          <option key={member.id} value={member.id}>{member.name} · {member.deviceName}</option>)}
      </select>
    </label>
    <div className="simulation-action-grid">
      <button onClick={() => useAppStore.getState().moveDemoMember('away')}><MoveUp/>Move away</button>
      <button onClick={() => useAppStore.getState().moveDemoMember('closer')}><MoveDown/>Move closer</button>
      <button className="simulated-sos" onClick={() => useAppStore.getState().triggerDemoSos()}><ShieldAlert/>Simulated SOS</button>
      <button onClick={() => useAppStore.getState().cancelDemoSos()}><HeartPulse/>Cancel SOS</button>
      <button onClick={() => useAppStore.getState().setDemoConnection(false)}><SignalZero/>Lose connection</button>
      <button onClick={() => useAppStore.getState().setDemoConnection(true)}><Signal/>Restore connection</button>
      <button onClick={() => useAppStore.getState().changeDemoBattery(-25)}><BatteryLow/>Drain battery</button>
      <button onClick={() => useAppStore.getState().changeDemoBattery(100)}><BatteryCharging/>Restore battery</button>
      <button onClick={() => useAppStore.getState().setDemoHeartbeat(true)}><Radio/>Set stale heartbeat</button>
      <button onClick={() => useAppStore.getState().setDemoHeartbeat(false)}><RefreshCcw/>Refresh heartbeat</button>
      <button onClick={() => useAppStore.getState().startReunion(selectedId)}><MapPin/>Start reunion</button>
      <button onClick={() => useAppStore.getState().useGuardianAsReunionPoint()}><MapPin/>Guardian reunion point</button>
      <button onClick={() => useAppStore.getState().moveGuardianTowardReunion()}><MoveDown/>Move guardian closer</button>
      <button onClick={() => useAppStore.getState().moveDemoMember('closer')}><MoveDown/>Move member closer</button>
      <button onClick={() => useAppStore.getState().completeDemoReunion()}><MapPin/>Enter reunion radius</button>
      <button onClick={() => useAppStore.getState().confirmReunion(selectedId)}><HeartPulse/>Complete reunion</button>
    </div>
    <label className="random-toggle">
      <input
        type="checkbox"
        checked={random}
        onChange={(event) => useAppStore.getState().setRandomMovement(event.target.checked)}
      />
      Seeded random movement
    </label>
  </div>;
}
