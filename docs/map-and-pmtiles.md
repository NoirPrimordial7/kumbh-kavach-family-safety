# Map and PMTiles

## Source chain

`src/config/mapConfig.ts` owns bounds, centre, URLs, zoom limits, attribution, and diagnostics. `src/services/mapSourceService.ts` produces a finite source chain:

1. Same-origin `public/maps/nashik-ramkund-v1.pmtiles`
2. OpenFreeMap vector backup
3. OpenStreetMap raster backup
4. Optional OPFS archive
5. Bundled coordinate fallback

The fallback is a real MapLibre style with verified event geography, not an error screen. It retains member markers, current-user marker, safety and reunion circles, connection lines, selection, pan/zoom, fit-family, scale, and coordinates.

`pmtilesProtocolService.ts` reference-counts protocol registration so React Strict Mode cannot register or remove it twice. `LiveMapPage` owns exactly one MapLibre instance and calls `resize()` from a `ResizeObserver`, window/fullscreen events, and font readiness.

## Regional asset

Bounds: `73.788,19.999,73.8005,20.012` (Ramkund, Nashik). Current archive: PMTiles v3, approximately 0.94 MB.

Generate with the official CLI:

```bash
pmtiles extract https://build.protomaps.com/YYYYMMDD.pmtiles public/maps/nashik-ramkund-v1.pmtiles --bbox=73.788,19.999,73.8005,20.012
npm run verify:maps
```

Choose a daily source that exists at extraction time. The removed `20260518` URL is invalid and must not return to runtime configuration.

## Hosting checks

Vercel serves `/maps/*` before SPA rewrites with immutable caching and `Accept-Ranges: bytes`. After deployment:

```bash
curl -I https://example.vercel.app/maps/nashik-ramkund-v1.pmtiles
curl -H "Range: bytes=0-7" https://example.vercel.app/maps/nashik-ramkund-v1.pmtiles
```

The second response should be binary PMTiles header data and normally return `206`. Never use `no-cors`, an HTML rewrite, or a proxy that drops range headers.
