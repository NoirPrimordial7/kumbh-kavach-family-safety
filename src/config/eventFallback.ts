import type { FeatureCollection } from 'geojson';

// Coordinates are derived from OpenStreetMap ways around Ramkund (snapshot checked 20 July 2026).
export const verifiedEventGeography: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { kind: 'water', name: 'Godavari River' }, geometry: { type: 'Polygon', coordinates: [[[73.79268,20.00402],[73.79302,20.00415],[73.79316,20.00560],[73.79280,20.00648],[73.79242,20.00635],[73.79250,20.00520],[73.79268,20.00402]]] } },
    { type: 'Feature', properties: { kind: 'road', name: 'Ramkund riverfront road' }, geometry: { type: 'LineString', coordinates: [[73.79300,20.00732],[73.79315,20.00692],[73.79330,20.00651],[73.79350,20.00618],[73.79356,20.00560],[73.79361,20.00501],[73.79369,20.00450],[73.79399,20.00411],[73.79435,20.00412]] } },
    { type: 'Feature', properties: { kind: 'road', name: 'Gadge Maharaj Bridge' }, geometry: { type: 'LineString', coordinates: [[73.7928317,20.0041395],[73.7942063,20.0045291]] } },
    { type: 'Feature', properties: { kind: 'path', name: 'Ramkund pedestrian path' }, geometry: { type: 'LineString', coordinates: [[73.7923521,20.005597],[73.7930928,20.0055976],[73.7935643,20.0055968]] } },
    { type: 'Feature', properties: { kind: 'path', name: 'River-side approach' }, geometry: { type: 'LineString', coordinates: [[73.79284,20.00458],[73.79264,20.00500],[73.79247,20.00527],[73.79226,20.00559],[73.79224,20.00603],[73.79208,20.00643]] } },
    { type: 'Feature', properties: { kind: 'boundary', name: 'Ramkund event safety area' }, geometry: { type: 'Polygon', coordinates: [[[73.7918,20.0039],[73.7962,20.0039],[73.7962,20.0080],[73.7918,20.0080],[73.7918,20.0039]]] } },
    { type: 'Feature', properties: { kind: 'anchor', name: 'Ramkund' }, geometry: { type: 'Point', coordinates: [73.794167,20.005556] } },
    { type: 'Feature', properties: { kind: 'help', name: 'Family Help Point' }, geometry: { type: 'Point', coordinates: [73.79355,20.00508] } },
    { type: 'Feature', properties: { kind: 'reunion', name: 'Suggested Reunion Point' }, geometry: { type: 'Point', coordinates: [73.79402,20.00548] } },
  ],
};
