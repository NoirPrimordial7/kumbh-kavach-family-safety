import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Expand,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildSimulationScenario } from '@/features/simulation/simulationScenario';
import { useAppStore } from '@/stores/useAppStore';
import type { SimulationSpeed } from '@/features/simulation/simulationTypes';
import { SimulationControls } from './SimulationControls';

const speeds: SimulationSpeed[] = [0.5, 1, 2, 4];

export function DemoDock() {
  const session = useAppStore((state) => state.session);
  const step = useAppStore((state) => state.demoStep);
  const playing = useAppStore((state) => state.demoPlaying);
  const speed = useAppStore((state) => state.demoSpeed);
  const config = useAppStore((state) => state.safetyConfig);
  const guardian = useAppStore((state) =>
    state.rawMembers.find((member) => member.id === 'guardian-phone')?.location);
  const setStep = useAppStore((state) => state.setDemoStep);
  const setPlaying = useAppStore((state) => state.setDemoPlaying);
  const [expanded, setExpanded] = useState(() =>
    !matchMedia('(max-width: 880px)').matches);
  const [controlsOpen, setControlsOpen] = useState(false);
  const scenario = useMemo(
    () => guardian ? buildSimulationScenario(config, guardian, Date.now()) : [],
    [config, guardian],
  );

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const next = useAppStore.getState().demoStep + 1;
      if (next > 8) setPlaying(false);
      else setStep(next);
    }, 2800 / speed);
    return () => clearInterval(timer);
  }, [playing, setPlaying, setStep, speed]);

  useEffect(() => {
    if (!playing || !useAppStore.getState().randomMovement) return;
    const timer = setInterval(() => {
      useAppStore.getState().moveDemoMember('away');
      window.setTimeout(() => useAppStore.getState().moveDemoMember('closer'), 550);
    }, 3600 / speed);
    return () => clearInterval(timer);
  }, [playing, speed]);

  if (!session?.id.startsWith('FAM-7X')) return null;
  const narration = scenario[step]?.narration ?? 'Deterministic demo ready.';

  return <aside className={`demo-dock ${expanded ? 'expanded' : 'collapsed'} ${controlsOpen ? 'controls-open' : ''}`}>
    <button
      className="demo-collapse"
      aria-label={expanded ? 'Collapse demo controls' : 'Open demo controls'}
      onClick={() => setExpanded((value) => !value)}
    ><span>DEMO</span><ChevronDown/></button>
    {expanded && <>
      <div className="demo-story">
        <small>STEP {step + 1} OF 9 · {speed}×</small>
        <strong>{narration}</strong>
      </div>
      <div className="demo-progress">
        {scenario.map((item, index) => <button
          key={item.id}
          className={index <= step ? 'done' : ''}
          onClick={() => setStep(index)}
          aria-label={`Go to demo step ${index + 1}: ${item.title}`}
        />)}
      </div>
      <div className="demo-controls">
        <button aria-label="Previous demo step" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft/></button>
        <button aria-label={playing ? 'Pause demo' : 'Play demo'} className="play" onClick={() => setPlaying(!playing)}>{playing ? <Pause/> : <Play/>}</button>
        <button aria-label="Next demo step" disabled={step === 8} onClick={() => setStep(step + 1)}><ChevronRight/></button>
        <button aria-label="Restart demo" onClick={() => setStep(0)}><RotateCcw/></button>
        <button aria-label="Reset all demo settings" onClick={() => useAppStore.getState().resetAllDemo()}>ALL</button>
        <select
          aria-label="Simulation speed"
          value={speed}
          onChange={(event) =>
            useAppStore.getState().setDemoSpeed(Number(event.target.value) as SimulationSpeed)}
        >
          {speeds.map((value) => <option key={value} value={value}>{value}×</option>)}
        </select>
        <button
          aria-label="Toggle full screen"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          }}
        ><Expand/></button>
        <button
          aria-label="Toggle simulation controls drawer"
          className={controlsOpen ? 'active' : ''}
          onClick={() => setControlsOpen((value) => !value)}
        ><SlidersHorizontal/></button>
      </div>
      {controlsOpen && <SimulationControls/>}
    </>}
  </aside>;
}
