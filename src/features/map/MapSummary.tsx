import { Phone, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import type { FamilyMember } from '@/types/domain';

interface MapSummaryProps {
  members: FamilyMember[];
  choose(id: string): void;
}

export function MapSummary({ members, choose }: MapSummaryProps) {
  const safe = members.filter((member) =>
    member.status === 'safe' || member.status === 'reunited').length;
  return <motion.aside className="member-panel summary-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <p className="eyebrow"><span/>Live family</p>
    <h2>{safe === members.length ? 'Everyone is close.' : 'Stay aware.'}</h2>
    <p>All status labels, alerts, cards and map circles use the same configurable safety engine.</p>
    <div className="mini-network">
      {members.map((member) => <button key={member.id} onClick={() => choose(member.id)}>
        <span className={`mini-dot status-${member.status}`}>
          {member.deviceKind === 'band' ? <Radio/> : <Phone/>}
        </span>
        <div><strong>{member.name}</strong><small>{Math.round(member.distance)}m · {member.status}</small></div>
      </button>)}
    </div>
  </motion.aside>;
}
