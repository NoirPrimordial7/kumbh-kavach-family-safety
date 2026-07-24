import { describe, expect, it } from 'vitest';
import { baseMapCandidates, bundledFallbackStyle, nextMapSourceIndex } from './mapSourceService';

describe('map source chain', () => {
  it('falls through in order and stops after bundled geography', () => {
    const sources = baseMapCandidates();
    expect(sources.map((source) => source.badge)).toEqual([
      'LIVE',
      'BACKUP MAP',
      'BACKUP MAP',
      'FALLBACK',
    ]);
    expect(sources[0].id).toBe('local-pmtiles');
    expect(String((sources[0].style as unknown as { sources: { ramkund: { url: string } } })
      .sources.ramkund.url)).toContain('/maps/nashik-ramkund-v1.pmtiles');
    expect(nextMapSourceIndex(0, sources.length)).toBe(1);
    expect(nextMapSourceIndex(sources.length - 1, sources.length)).toBe(-1);
  });
  it('places an installed offline archive before the intentional fallback', () => {
    const offline = bundledFallbackStyle();
    const sources = baseMapCandidates(offline);
    expect(sources.at(-2)?.badge).toBe('OFFLINE');
    expect(sources.at(-1)?.badge).toBe('FALLBACK');
  });
  it('bundles meaningful event layers', () => {
    expect(bundledFallbackStyle().layers.map((layer) => layer.id)).toEqual(expect.arrayContaining(['water', 'roads', 'paths', 'event-boundary', 'places']));
  });
});
