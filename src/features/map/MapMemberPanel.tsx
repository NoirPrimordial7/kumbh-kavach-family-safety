import { BatteryMedium, Navigation, Signal, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Avatar, StatusBadge } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';
import type { FamilyMember } from '@/types/domain';

interface MapMemberPanelProps {
  member: FamilyMember;
  close(): void;
}

export function MapMemberPanel({ member, close }: MapMemberPanelProps) {
  const config = useAppStore((state) => state.safetyConfig);
  const activeReunion = useAppStore((state) => state.reunionMemberId === member.id);
  const eligible = useAppStore((state) => state.reunionEligibleIds.includes(member.id));
  const acknowledged = useAppStore((state) => state.acknowledgedSosIds.includes(member.id));
  const reunionProgress = useAppStore((state) => state.reunionProgress);

  return <motion.aside
    className="member-panel"
    initial={{ opacity: 0, x: 18 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 18 }}
  >
    <button className="panel-close" onClick={close} aria-label="Close member details"><X/></button>
    <div className="member-panel-head">
      <Avatar name={member.name} tone={member.status}/>
      <div>
        <span>{member.relation}</span>
        <h2>{member.name}</h2>
        <StatusBadge status={member.status}/>
      </div>
    </div>
    <div className="device-reality">
      {member.reality === 'simulated' ? 'SIMULATED NOW' : member.reality === 'real' ? 'REAL NOW · BLE' : 'REAL NOW · PHONE'}
      <span>{member.deviceName}</span>
    </div>
    {activeReunion && <div className="reunion-progress" role="status">
      <small>REUNION PROGRESS</small>
      <strong>{reunionProgress.replaceAll('-', ' ')}</strong>
      <span>{Math.round(member.reunionDistanceMetres)}m to reunion point · target {config.reunionRadiusMeters}m</span>
    </div>}
    <dl className="detail-grid">
      <div><dt>Guardian distance</dt><dd>{Math.round(member.distance)} metres</dd></div>
      <div><dt>Reunion point</dt><dd>{Math.round(member.reunionDistanceMetres)} metres</dd></div>
      <div><dt>Accuracy</dt><dd>±{Math.round(member.position.accuracy)}m</dd></div>
      <div><dt>Battery</dt><dd><BatteryMedium/>{member.battery}%</dd></div>
      <div><dt>Connection</dt><dd><Signal/>{member.connection}</dd></div>
      <div><dt>Last update</dt><dd>{Math.round(member.heartbeatAgeMs / 1000)}s ago</dd></div>
    </dl>
    <div className="panel-actions">
      {member.status === 'sos' && !acknowledged &&
        <Button variant="violet" onClick={() => useAppStore.getState().acknowledge(member.id)}>
          Acknowledge SOS
        </Button>}
      {member.status === 'sos' && acknowledged &&
        <Button variant="danger" onClick={() => useAppStore.getState().resolveAlert(member.id)}>
          Resolve simulated SOS
        </Button>}
      <Button variant="violet" onClick={() => useAppStore.getState().startReunion(member.id)}>
        <Navigation/>{activeReunion ? 'Reunion active' : 'Start reunion'}
      </Button>
      {activeReunion && eligible && member.reunionDistanceMetres <= config.reunionRadiusMeters && member.status !== 'sos' &&
        <Button onClick={() => useAppStore.getState().confirmReunion(member.id)}>
          Simulated/manual confirm reunited
        </Button>}
    </div>
    <details className="technical-details">
      <summary>Technical details</summary>
      <p>{member.position.lat.toFixed(5)}, {member.position.lng.toFixed(5)}</p>
      <p>{member.reality} · {member.connection} · effective distance {Math.round(member.effectiveDistanceMetres)}m</p>
    </details>
  </motion.aside>;
}
