import type { DerivedMember, SafetyAlert } from '@/types/safety';

const alertKindFor = (member: DerivedMember): SafetyAlert['kind'] | undefined => {
  if (member.status === 'sos') return 'sos';
  if (member.status === 'separated') return 'separation';
  if (member.status === 'offline') return 'offline';
  return undefined;
};

export function reconcileAlerts(existing: SafetyAlert[], members: DerivedMember[], now: number, idFactory: () => string = () => crypto.randomUUID()): SafetyAlert[] {
  const next = existing.map((alert) => ({ ...alert }));
  for (const member of members) {
    const kind = alertKindFor(member);
    for (const alert of next.filter((item) => item.memberId === member.id && !item.resolvedAt && item.kind !== kind)) {
      alert.resolvedAt = now;
      alert.updatedAt = now;
    }
    if (!kind) continue;
    const open = next.find((alert) => alert.memberId === member.id && alert.kind === kind && !alert.resolvedAt);
    if (open) open.updatedAt = now;
    else next.push({ id: idFactory(), memberId: member.id, kind, openedAt: now, updatedAt: now });
  }
  return next;
}
