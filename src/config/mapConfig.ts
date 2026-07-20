export const mapConfig = {
  eventName: 'Ramkund · Nashik',
  center: [73.794167, 20.005556] as [number, number],
  bounds: [73.788, 19.999, 73.8005, 20.012] as [number, number, number, number],
  minZoom: 13,
  defaultZoom: 16.2,
  maxZoom: 19,
  primaryStyleUrl: import.meta.env.VITE_MAP_PRIMARY_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
  secondaryRasterUrl: import.meta.env.VITE_MAP_SECONDARY_RASTER_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  onlineArchiveUrl: import.meta.env.VITE_PMTILES_URL ?? 'https://build.protomaps.com/20260518.pmtiles',
  offlineArchiveUrl: import.meta.env.VITE_OFFLINE_PMTILES_URL ?? '/maps/nashik-ramkund-v1.pmtiles',
  attribution: '© OpenStreetMap contributors · Protomaps',
  downloadLabel: 'Ramkund event area',
  approximateDownloadBytes: 24_000_000,
} as const;

export const eventPlaces = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Ramkund', kind: 'event-anchor' }, geometry: { type: 'Point', coordinates: [73.794167, 20.005556] } },
    { type: 'Feature', properties: { name: 'Godavari riverfront', kind: 'event-zone' }, geometry: { type: 'Point', coordinates: [73.792294, 20.008064] } },
  ],
} as const;
