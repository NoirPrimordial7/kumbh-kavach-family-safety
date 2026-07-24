import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

const protocol = new Protocol();
let consumers = 0;
let registered = false;
const repairNestedHttpScheme = (url: string) =>
  url.replace(/^pmtiles:\/\/(https?)\/\//, 'pmtiles://$1://');

const loadPmtiles: Parameters<typeof maplibregl.addProtocol>[1] = (
  request,
  abortController,
) => protocol.tile(
  { ...request, url: repairNestedHttpScheme(request.url) },
  abortController,
);

export function acquirePmtilesProtocol() {
  consumers += 1;
  if (!registered) {
    maplibregl.addProtocol('pmtiles', loadPmtiles);
    registered = true;
  }
  return protocol;
}

export function releasePmtilesProtocol() {
  consumers = Math.max(0, consumers - 1);
  if (registered && consumers === 0) {
    maplibregl.removeProtocol('pmtiles');
    registered = false;
  }
}

export function pmtilesProtocolDiagnostics() {
  return { consumers, registered };
}
