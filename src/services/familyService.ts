import type { FamilySession } from '@/types/domain';
export function createInvite(session: FamilySession) { return `${window.location.origin}/join?code=${session.joinCode.replaceAll(' ','')}`; }
export function remainingTime(session: FamilySession) { const end = session.startedAt + session.durationHours * 3_600_000; const ms = Math.max(0, end - Date.now()); return `${Math.floor(ms/3_600_000)}h ${Math.floor(ms/60_000)%60}m`; }
