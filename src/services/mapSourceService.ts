import type { StyleSpecification } from 'maplibre-gl';
import { mapConfig } from '@/config/mapConfig';
import { verifiedEventGeography } from '@/config/eventFallback';

export type MapSourceBadge = 'LIVE' | 'BACKUP MAP' | 'OFFLINE' | 'FALLBACK';
export interface MapSourceCandidate { id: string; badge: MapSourceBadge; label: string; style: string | StyleSpecification }

export const rasterBackupStyle = (): StyleSpecification => ({
  version: 8, name: 'OpenStreetMap backup',
  sources: { osm: { type: 'raster', tiles: [mapConfig.secondaryRasterUrl], tileSize: 256, attribution: '© OpenStreetMap contributors' } },
  layers: [{ id: 'paper', type: 'background', paint: { 'background-color': '#eee9df' } }, { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.35, 'raster-contrast': -0.08 } }],
});

export const bundledFallbackStyle = (): StyleSpecification => ({
  version: 8, name: 'Verified Ramkund fallback', sources: { event: { type: 'geojson', data: verifiedEventGeography } },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': '#e8e2d5' } },
    { id: 'event-boundary', type: 'fill', source: 'event', filter: ['==', ['get', 'kind'], 'boundary'], paint: { 'fill-color': '#6c4dff', 'fill-opacity': 0.05 } },
    { id: 'water', type: 'fill', source: 'event', filter: ['==', ['get', 'kind'], 'water'], paint: { 'fill-color': '#8dd4ed', 'fill-opacity': 0.95 } },
    { id: 'roads', type: 'line', source: 'event', filter: ['==', ['get', 'kind'], 'road'], paint: { 'line-color': '#fffdf7', 'line-width': 7 } },
    { id: 'paths', type: 'line', source: 'event', filter: ['==', ['get', 'kind'], 'path'], paint: { 'line-color': '#977d62', 'line-width': 2, 'line-dasharray': [2, 2] } },
    { id: 'boundary-line', type: 'line', source: 'event', filter: ['==', ['get', 'kind'], 'boundary'], paint: { 'line-color': '#6c4dff', 'line-width': 2, 'line-dasharray': [3, 2] } },
    { id: 'places', type: 'circle', source: 'event', filter: ['in', ['get', 'kind'], ['literal', ['anchor','help','reunion']]], paint: { 'circle-radius': 7, 'circle-color': ['match', ['get','kind'], 'help', '#ff5a36', 'reunion', '#6c4dff', '#101010'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } },
  ],
});

export function baseMapCandidates(offlineStyle?: StyleSpecification): MapSourceCandidate[] {
  return [
    { id: 'primary', badge: 'LIVE', label: 'OpenFreeMap vector', style: mapConfig.primaryStyleUrl },
    { id: 'secondary', badge: 'BACKUP MAP', label: 'OpenStreetMap raster', style: rasterBackupStyle() },
    ...(offlineStyle ? [{ id: 'offline', badge: 'OFFLINE' as const, label: 'Downloaded Ramkund map', style: offlineStyle }] : []),
    { id: 'fallback', badge: 'FALLBACK', label: 'Verified event geography', style: bundledFallbackStyle() },
  ];
}

export const nextMapSourceIndex = (current: number, total: number) => current + 1 < total ? current + 1 : -1;
