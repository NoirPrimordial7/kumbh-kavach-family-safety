import { describe, expect, it } from 'vitest';
import { deriveFamily } from '@/services/familySafetyEngine';
import { seededMembers } from './useAppStore';

describe('initial family geography', () => {
  it('starts every named teammate within the 50m safety radius at deterministic distances', () => {
    const members = seededMembers();
    const derived = deriveFamily(members, 'guardian-phone', Date.now());
    expect(derived.map((member) => member.name)).toEqual(['Ashwin Gudur', 'Aditya Gholap', 'Himank Maheshwari', 'Arya Dhumal']);
    expect(derived.every((member) => member.status === 'safe')).toBe(true);
    expect(Math.round(derived.find((member) => member.id === 'member-phone')!.distanceMetres)).toBe(25);
    expect(Math.round(derived.find((member) => member.id === 'band-01')!.distanceMetres)).toBe(41);
    expect(Math.round(derived.find((member) => member.id === 'band-02')!.distanceMetres)).toBe(39);
  });
});
