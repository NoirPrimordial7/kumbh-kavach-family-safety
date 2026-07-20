import type { FamilyMember } from '@/types/domain';
export const isPhysicalDevice = (member: FamilyMember) => member.reality === 'real' || member.reality === 'phone';
export const deviceLabel = (member: FamilyMember) => member.reality === 'simulated' ? 'SIMULATED DEVICE' : member.reality === 'real' ? 'REAL BLE DEVICE' : member.reality === 'phone' ? 'PHONE' : 'OFFLINE';
