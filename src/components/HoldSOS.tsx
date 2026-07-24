import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Siren } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

const HOLD_DURATION_MS = 3_000;

export function HoldSOS() {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const demoSession = useAppStore((state) => state.session?.id.startsWith('FAM-7X'));
  const triggerGuardianSos = useAppStore((state) => state.triggerGuardianSos);

  const cancel = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
  };

  const start = () => {
    if (holding) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      triggerGuardianSos();
      timer.current = undefined;
      setHolding(false);
    }, HOLD_DURATION_MS);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (demoSession) return null;

  return (
    <button
      aria-label="Hold for three seconds to send SOS from this phone"
      className={`hold-sos ${holding ? 'holding' : ''}`}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) start();
      }}
      onKeyUp={cancel}
      onPointerCancel={cancel}
      onPointerDown={start}
      onPointerLeave={cancel}
      onPointerUp={cancel}
      type="button"
    >
      <motion.span
        animate={holding ? { scale: [1, 1.12, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <Siren aria-hidden="true" />
      </motion.span>
      <strong>{holding ? 'Keep holding…' : 'Hold for SOS'}</strong>
      <small>3 seconds · this phone</small>
    </button>
  );
}
