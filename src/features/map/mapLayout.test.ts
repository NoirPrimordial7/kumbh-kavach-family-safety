import { describe, expect, it } from 'vitest';
import { mapPadding, snapFromDrag } from './mapLayout';

describe('responsive map layout', () => {
  it('reserves camera space for desktop panel and mobile sheet', () => {
    expect(mapPadding(true, false, 'peek').right).toBe(390);
    expect(mapPadding(false, false, 'peek').right).toBe(32);
    expect(mapPadding(false, true, 'half').bottom).toBeGreaterThan(300);
  });
  it('moves the mobile sheet between drag snaps', () => {
    expect(snapFromDrag('peek', -80)).toBe('half');
    expect(snapFromDrag('full', 80)).toBe('half');
  });
});
