import { describe, expect, it } from 'vitest';
import { baseMapCandidates, bundledFallbackStyle, nextMapSourceIndex } from './mapSourceService';

describe('map source chain', () => {
  it('falls through in order and stops after bundled geography', () => {
    const sources = baseMapCandidates();
    expect(sources.map((source) => source.badge)).toEqual(['LIVE', 'BACKUP MAP', 'FALLBACK']);
    expect(nextMapSourceIndex(0, sources.length)).toBe(1);
    expect(nextMapSourceIndex(2, sources.length)).toBe(-1);
  });
  it('bundles meaningful event layers', () => {
    expect(bundledFallbackStyle().layers.map((layer) => layer.id)).toEqual(expect.arrayContaining(['water', 'roads', 'paths', 'event-boundary', 'places']));
  });
});
