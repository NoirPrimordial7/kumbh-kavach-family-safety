import { useEffect, useState } from 'react';
import { MapPin, Navigation, ShieldCheck, Siren } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';

export function EmergencyOverlay() {
  const member = useAppStore((state) => state.members.find((item) => item.status === 'sos'));
  const [dismissedId, setDismissedId] = useState<string>();
  useEffect(() => { if (!member) setDismissedId(undefined); }, [member]);
  if (!member || dismissedId === member.id) return null;
  const dismiss = (action: () => void) => { action(); setDismissedId(member.id); };
  return <motion.div className="emergency-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alertdialog" aria-modal="true" aria-label={`SOS from ${member.name}`}><motion.div className="emergency-pulse" animate={{ scale: [.8, 1.2], opacity: [.4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}/><section><span className="emergency-icon"><Siren/></span><p>SOS RECEIVED</p><h1>{member.name} needs help.</h1><div className="emergency-facts"><span><MapPin/><small>LAST KNOWN</small><strong>{member.position.lat.toFixed(4)}, {member.position.lng.toFixed(4)}</strong></span><span><ShieldCheck/><small>LAST HEARTBEAT</small><strong>Just now · ±{member.position.accuracy}m</strong></span></div><div><Button variant="secondary" onClick={() => dismiss(() => useAppStore.getState().acknowledge(member.id))}>Acknowledge</Button><Button onClick={() => dismiss(() => useAppStore.getState().startReunion(member.id))}><Navigation/>Start reunion</Button><Button variant="ghost" onClick={() => dismiss(() => useAppStore.getState().resolveAlert(member.id))}>Dismiss alert</Button></div><small>DEMO SOS · No emergency services have been contacted</small></section></motion.div>;
}
