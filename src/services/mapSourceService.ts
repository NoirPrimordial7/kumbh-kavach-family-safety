import type { StyleSpecification } from 'maplibre-gl';
import { mapConfig } from '@/config/mapConfig';
import { verifiedEventGeography } from '@/config/eventFallback';

export type MapSourceBadge = 'LIVE' | 'BACKUP MAP' | 'OFFLINE' | 'FALLBACK';
export interface MapSourceCandidate {
  id: string;
  badge: MapSourceBadge;
  label: string;
  style: string | StyleSpecification;
}

export const pmtilesVectorStyle = (
  archiveUrl: string,
  name = 'Same-origin Ramkund PMTiles',
): StyleSpecification => {
  const absoluteArchiveUrl = new URL(
    archiveUrl,
    globalThis.location?.origin ?? 'http://localhost',
  ).href;
  return ({
  version: 8,
  name,
  glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
  sources: {
    ramkund: {
      type: 'vector',
      url: `pmtiles://${absoluteArchiveUrl}`,
      attribution: mapConfig.attribution,
    },
  },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': '#e9e4d7' } },
    { id: 'water', type: 'fill', source: 'ramkund', 'source-layer': 'water', paint: { 'fill-color': '#8fd4e8' } },
    { id: 'parks', type: 'fill', source: 'ramkund', 'source-layer': 'landuse', filter: ['in', 'kind', 'park', 'grass', 'garden'], paint: { 'fill-color': '#dbe7bd', 'fill-opacity': 0.8 } },
    { id: 'buildings', type: 'fill', source: 'ramkund', 'source-layer': 'buildings', minzoom: 14, paint: { 'fill-color': '#d3ccbd', 'fill-outline-color': '#b7ae9e' } },
    { id: 'roads-casing', type: 'line', source: 'ramkund', 'source-layer': 'roads', paint: { 'line-color': '#b9ae9c', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 17, 6] } },
    { id: 'roads', type: 'line', source: 'ramkund', 'source-layer': 'roads', paint: { 'line-color': '#fffdf7', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 17, 4.5] } },
  ],
  });
};

export const rasterBackupStyle = (): StyleSpecification => ({
  version: 8,
  name: 'OpenStreetMap backup',
  sources: {
    osm: {
      type: 'raster',
      tiles: [mapConfig.secondaryRasterUrl],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': '#eee9df' } },
    { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.35, 'raster-contrast': -0.08 } },
  ],
});

export const bundledFallbackStyle = (): StyleSpecification => ({
  version: 8,
  name: 'Offline coordinate map',
  sources: { event: { type: 'geojson', data: verifiedEventGeography } },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': '#e8e2d5' } },
    { id: 'event-boundary', type: 'fill', source: 'event', filter: ['==', ['get', 'kind'], 'boundary'], paint: { 'fill-color': '#6c4dff', 'fill-opacity': 0.05 } },
    { id: 'water', type: 'fill', source: 'event', filter: ['==', ['get', 'kind'], 'water'], paint: { 'fill-color': '#8dd4ed', 'fill-opacity': 0.95 } },
    { id: 'roads', type: 'line', source: 'event', filter: ['==', ['get', 'kind'], 'road'], paint: { 'line-color': '#fffdf7', 'line-width': 7 } },
    { id: 'paths', type: 'line', source: 'event', filter: ['==', ['get', 'kind'], 'path'], paint: { 'line-color': '#977d62', 'line-width': 2, 'line-dasharray': [2, 2] } },
    { id: 'boundary-line', type: 'line', source: 'event', filter: ['==', ['get', 'kind'], 'boundary'], paint: { 'line-color': '#6c4dff', 'line-width': 2, 'line-dasharray': [3, 2] } },
    { id: 'places', type: 'circle', source: 'event', filter: ['in', ['get', 'kind'], ['literal', ['anchor', 'help', 'reunion']]], paint: { 'circle-radius': 7, 'circle-color': ['match', ['get', 'kind'], 'help', '#ff5a36', 'reunion', '#6c4dff', '#101010'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } },
  ],
});

export function baseMapCandidates(
  offlineStyle?: StyleSpecification,
): MapSourceCandidate[] {
  return [
    {
      id: 'local-pmtiles',
      badge: 'LIVE',
      label: 'Same-origin Ramkund PMTiles',
      style: pmtilesVectorStyle(mapConfig.localArchiveUrl),
    },
    {
      id: 'remote-vector',
      badge: 'BACKUP MAP',
      label: 'OpenFreeMap vector backup',
      style: mapConfig.primaryStyleUrl,
    },
    {
      id: 'secondary',
      badge: 'BACKUP MAP',
      label: 'OpenStreetMap raster backup',
      style: rasterBackupStyle(),
    },
    ...(offlineStyle
      ? [{ id: 'offline', badge: 'OFFLINE' as const, label: 'Downloaded Ramkund map', style: offlineStyle }]
      : []),
    {
      id: 'fallback',
      badge: 'FALLBACK',
      label: 'Offline coordinate map',
      style: bundledFallbackStyle(),
    },
  ];
}

export const nextMapSourceIndex = (current: number, total: number) =>
  current + 1 < total ? current + 1 : -1;
