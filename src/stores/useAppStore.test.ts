import { beforeEach, describe, expect, it } from 'vitest';
import { recommendedSafetyConfig } from '@/domain/safety/safetyConfig';
import { useAppStore } from './useAppStore';

describe('application store safety flows', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetAllDemo();
  });

  it('recomputes member state immediately when the safe radius changes', () => {
    useAppStore.getState().setDemoStep(2);
    const before = useAppStore.getState().members.find((member) => member.id === 'band-02');
    useAppStore.getState().updateSafety({ safeRadiusMeters: 100 });
    const after = useAppStore.getState().members.find((member) => member.id === 'band-02');
    expect(before?.status).toBe('warning');
    expect(after?.status).toBe('safe');
    expect(after?.distance).toBeCloseTo(before?.distance ?? 0, 5);
    expect(useAppStore.getState().session?.safetyRadius).toBe(100);
  });

  it('persists a valid safety configuration', () => {
    useAppStore.getState().updateSafety({ safeRadiusMeters: 72, reunionRadiusMeters: 11 });
    const stored = JSON.parse(localStorage.getItem('kumbh-kavach-state') ?? '{}');
    expect(stored.state.safetyConfig).toMatchObject({
      safeRadiusMeters: 72,
      reunionRadiusMeters: 11,
    });
  });

  it('supports simulated SOS acknowledgement and resolution', () => {
    useAppStore.getState().triggerDemoSos();
    expect(useAppStore.getState().members.find((member) => member.id === 'band-02')?.status)
      .toBe('sos');
    useAppStore.getState().acknowledge('band-02');
    useAppStore.getState().resolveAlert('band-02');
    expect(useAppStore.getState().members.find((member) => member.id === 'band-02')?.status)
      .not.toBe('sos');
  });

  it('resets ranges, simulation speed, and movement together', () => {
    useAppStore.getState().updateSafety({ safeRadiusMeters: 90 });
    useAppStore.getState().setDemoSpeed(4);
    useAppStore.getState().setRandomMovement(true);
    useAppStore.getState().resetAllDemo();
    expect(useAppStore.getState().safetyConfig).toEqual(recommendedSafetyConfig);
    expect(useAppStore.getState().demoSpeed).toBe(1);
    expect(useAppStore.getState().randomMovement).toBe(false);
  });
});
