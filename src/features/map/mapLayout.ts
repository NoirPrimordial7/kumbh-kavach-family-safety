export type SheetSnap = 'peek' | 'half' | 'full';
export const mapPadding = (panelOpen: boolean, mobile: boolean, snap: SheetSnap) => mobile
  ? { top: 72, right: 20, bottom: snap === 'peek' ? 118 : snap === 'half' ? 340 : 520, left: 20 }
  : { top: 32, right: panelOpen ? 390 : 32, bottom: 56, left: 72 };

export const snapFromDrag = (current: SheetSnap, deltaY: number): SheetSnap => {
  if (deltaY < -55) return current === 'peek' ? 'half' : 'full';
  if (deltaY > 55) return current === 'full' ? 'half' : 'peek';
  return current;
};
