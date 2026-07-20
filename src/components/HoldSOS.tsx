import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Siren } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export function HoldSOS() {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number>();
  const demoSession = useAppStore((state) => state.session?.id.startsWith('FAM-7X'));
  const start = () => { setHolding(true); timer.current = window.setTimeout(() => { useAppStore.getState().setDemoStep(5); setHolding(false); }, 3000); };
  const cancel = () => { clearTimeout(timer.current); setHolding(false); };
  if (demoSession) return null;
  return <button className={`hold-sos ${holding ? 'holding' : ''}`} onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel}><motion.span animate={holding ? { scale: [1, 1.16, 1] } : {}} transition={{ duration: .7, repeat: Infinity }}><Siren/></motion.span><strong>{holding ? 'Keep holding…' : 'Hold for SOS'}</strong><small>3 seconds · simulated phone</small></button>;
}
