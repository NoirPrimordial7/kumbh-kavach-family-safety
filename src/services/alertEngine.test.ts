import { describe, expect, it } from 'vitest';
import { reconcileAlerts } from './alertEngine';
import type { DerivedMember } from '@/types/safety';

const separated = { id: 'arya', status: 'separated' } as DerivedMember;

describe('alert reconciliation', () => {
  it('deduplicates an open alert for the same member and condition', () => {
    const first = reconcileAlerts([], [separated], 100, () => 'alert-1');
    const second = reconcileAlerts(first, [separated], 200, () => 'alert-2');
    expect(second).toHaveLength(1);
    expect(second[0]).toMatchObject({ id: 'alert-1', openedAt: 100, updatedAt: 200 });
  });

  it('resolves stale conditions and opens the new condition', () => {
    const first = reconcileAlerts([], [separated], 100, () => 'separation');
    const sos = { ...separated, status: 'sos' } as DerivedMember;
    const next = reconcileAlerts(first, [sos], 200, () => 'sos');
    expect(next.find((alert) => alert.id === 'separation')?.resolvedAt).toBe(200);
    expect(next.find((alert) => alert.id === 'sos')?.resolvedAt).toBeUndefined();
  });
});
