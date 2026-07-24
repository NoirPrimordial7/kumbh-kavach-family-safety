import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { recommendedSafetyConfig } from '@/domain/safety/safetyConfig';
import { useAppStore } from '@/stores/useAppStore';
import { SafetyRangeSettings } from './SafetyRangeSettings';

describe('SafetyRangeSettings', () => {
  beforeEach(() => {
    useAppStore.getState().resetAllDemo();
  });

  it('applies presets and immediately updates warning distance', () => {
    render(<SafetyRangeSettings/>);
    fireEvent.click(screen.getByRole('button', { name: /20m very close/i }));
    expect(useAppStore.getState().safetyConfig.safeRadiusMeters).toBe(20);
    expect(screen.getByText('16m')).toBeInTheDocument();
  });

  it('accepts custom values and rejects values outside the domain', () => {
    render(<SafetyRangeSettings/>);
    const numeric = screen.getByRole('spinbutton', { name: /custom safe radius numeric/i });
    fireEvent.change(numeric, { target: { value: '125' } });
    expect(useAppStore.getState().safetyConfig.safeRadiusMeters).toBe(125);
    fireEvent.change(numeric, { target: { value: '1001' } });
    expect(useAppStore.getState().safetyConfig.safeRadiusMeters).toBe(125);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('restores the documented recommended defaults', () => {
    useAppStore.getState().updateSafety({ safeRadiusMeters: 100 });
    render(<SafetyRangeSettings/>);
    fireEvent.click(screen.getByRole('button', { name: /reset recommended defaults/i }));
    expect(useAppStore.getState().safetyConfig).toEqual(recommendedSafetyConfig);
  });

  it('edits validated advanced timing settings', () => {
    render(<SafetyRangeSettings/>);
    fireEvent.click(screen.getByText('Advanced safety timing'));
    fireEvent.change(screen.getByRole('spinbutton', { name: /separation grace/i }), {
      target: { value: '9' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: /reunion stable time/i }), {
      target: { value: '4' },
    });
    expect(useAppStore.getState().safetyConfig).toMatchObject({
      separationGraceSeconds: 9,
      reunionStableSeconds: 4,
    });
  });
});
