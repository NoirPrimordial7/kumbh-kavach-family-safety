import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl';
import { FileSource, PMTiles, Protocol } from 'pmtiles';
import { circle, featureCollection, lineString, point } from '@turf/turf';
import { BatteryMedium, Crosshair, LocateFixed, MapPin, Navigation, Phone, Radio, ShieldAlert, Signal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Avatar, PageHeading, StatusBadge } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { mapConfig } from '@/config/mapConfig';
import { useAppStore } from '@/stores/useAppStore';
import type { FamilyMember } from '@/types/domain';
import { offlineMapService } from '@/services/offlineMapService';

const protocol = new Protocol();
let protocolRegistered = false;
const statusColor: Record<string, string> = { safe: '#38a169', reunited: '#38a169', warning: '#f2c94c', separated: '#ef5a36', sos: '#a62cce', offline: '#8a8a82' };

function mapStyle(archiveUrl: string): StyleSpecification {
  return {
    version: 8,
    name: 'Kumbh Kavach paper map',
    sources: { protomaps: { type: 'vector', url: `pmtiles://${archiveUrl}`, attribution: mapConfig.attribution } },
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    layers: [
      { id: 'paper', type: 'background', paint: { 'background-color': '#e9e4d7' } },
      { id: 'water', type: 'fill', source: 'protomaps', 'source-layer': 'water', paint: { 'fill-color': '#8fd4e8' } },
      { id: 'parks', type: 'fill', source: 'protomaps', 'source-layer': 'landuse', filter: ['in', 'kind', 'park', 'grass', 'garden'], paint: { 'fill-color': '#dbe7bd', 'fill-opacity': .8 } },
      { id: 'buildings', type: 'fill', source: 'protomaps', 'source-layer': 'buildings', minzoom: 14, paint: { 'fill-color': '#d3ccbd', 'fill-outline-color': '#b7ae9e' } },
      { id: 'roads-casing', type: 'line', source: 'protomaps', 'source-layer': 'roads', paint: { 'line-color': '#b9ae9c', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 17, 6] } },
      { id: 'roads', type: 'line', source: 'protomaps', 'source-layer': 'roads', paint: { 'line-color': '#fffdf7', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, .5, 17, 4.5] } },
      { id: 'places', type: 'symbol', source: 'protomaps', 'source-layer': 'places', minzoom: 12, layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 17, 14] }, paint: { 'text-color': '#28251f', 'text-halo-color': '#f4f2ed', 'text-halo-width': 1.5 } },
    ],
  };
}

function familyGeoJson(members: FamilyMember[]) {
  return featureCollection(members.map((member) => point([member.position.lng, member.position.lat], { id: member.id, name: member.name, status: member.status, color: statusColor[member.status] })));
}

export function LiveMapPage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const members = useAppStore((state) => state.members);
  const selectedId = useAppStore((state) => state.selectedMemberId);
  const select = useAppStore((state) => state.selectMember);
  const reunionMemberId = useAppStore((state) => state.reunionMemberId);
  const startReunion = useAppStore((state) => state.startReunion);
  const mapMode = useAppStore((state) => state.mapMode);
  const [mapError, setMapError] = useState('');
  const [archiveKey, setArchiveKey] = useState(mapConfig.onlineArchiveUrl);
  const [sheetSnap, setSheetSnap] = useState<'peek' | 'half' | 'full'>('peek');
  const selected = members.find((member) => member.id === selectedId) ?? null;
  const guardian = members.find((member) => member.id === 'guardian-phone');
  const urgent = members.find((member) => member.status === 'sos' || member.status === 'separated');
  const data = useMemo(() => familyGeoJson(members), [members]);

  useEffect(() => {
    let active = true;
    async function chooseArchive() {
      const preferOffline = mapMode === 'offline' || !navigator.onLine;
      if (preferOffline && await offlineMapService.isInstalled()) {
        const file = await offlineMapService.getFile();
        const archive = new PMTiles(new FileSource(file));
        protocol.add(archive);
        if (active) setArchiveKey(file.name);
      } else {
        if (active) setArchiveKey(mapConfig.onlineArchiveUrl);
        if (preferOffline && active) setMapError('No offline Ramkund archive is installed; using the online PMTiles source when available.');
      }
    }
    void chooseArchive();
    return () => { active = false; };
  }, [mapMode]);

  useEffect(() => {
    if (!container.current) return;
    const initialMembers = useAppStore.getState().members;
    const initialGuardian = initialMembers.find((member) => member.id === 'guardian-phone');
    const initialData = familyGeoJson(initialMembers);
    if (!protocolRegistered) { maplibregl.addProtocol('pmtiles', protocol.tile); protocolRegistered = true; }
    const map = new maplibregl.Map({ container: container.current, style: mapStyle(archiveKey), center: mapConfig.center, zoom: mapConfig.defaultZoom, minZoom: mapConfig.minZoom, maxZoom: mapConfig.maxZoom, maxBounds: mapConfig.bounds, attributionControl: false });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('load', () => {
      if (!initialGuardian) return;
      map.addSource('safe-radius', { type: 'geojson', data: circle([initialGuardian.position.lng, initialGuardian.position.lat], 50, { steps: 72, units: 'meters' }) });
      map.addLayer({ id: 'safe-radius-fill', type: 'fill', source: 'safe-radius', paint: { 'fill-color': '#38a169', 'fill-opacity': .09 } });
      map.addLayer({ id: 'safe-radius-line', type: 'line', source: 'safe-radius', paint: { 'line-color': '#27824b', 'line-width': 2, 'line-dasharray': [3, 2] } });
      map.addSource('family-members', { type: 'geojson', data: initialData });
      map.addLayer({ id: 'member-rings', type: 'circle', source: 'family-members', paint: { 'circle-radius': 13, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fffdf7', 'circle-stroke-width': 4 } });
      map.addLayer({ id: 'member-labels', type: 'symbol', source: 'family-members', layout: { 'text-field': ['concat', ['get', 'name'], '\n', ['upcase', ['get', 'status']]], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-offset': [0, 2.2], 'text-anchor': 'top', 'text-allow-overlap': false }, paint: { 'text-color': '#101010', 'text-halo-color': '#fffdf7', 'text-halo-width': 2 } });
      map.on('click', 'member-rings', (event) => { const id = event.features?.[0]?.properties?.id as string | undefined; if (id) { useAppStore.getState().selectMember(id); setSheetSnap('half'); } });
    });
    map.on('error', (event) => setMapError(event.error?.message ?? 'Map data is temporarily unavailable.'));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [archiveKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    (map.getSource('family-members') as GeoJSONSource | undefined)?.setData(data);
    if (guardian) (map.getSource('safe-radius') as GeoJSONSource | undefined)?.setData(circle([guardian.position.lng, guardian.position.lat], 50, { steps: 72, units: 'meters' }));
    if (map.getLayer('reunion-line')) map.removeLayer('reunion-line');
    if (map.getSource('reunion-line')) map.removeSource('reunion-line');
    const target = members.find((member) => member.id === reunionMemberId);
    if (guardian && target) {
      map.addSource('reunion-line', { type: 'geojson', data: lineString([[guardian.position.lng, guardian.position.lat], [target.position.lng, target.position.lat]]) });
      map.addLayer({ id: 'reunion-line', type: 'line', source: 'reunion-line', paint: { 'line-color': '#6c4dff', 'line-width': 4, 'line-dasharray': [2, 2] } });
    }
  }, [data, guardian, members, reunionMemberId]);

  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') select(null); }; addEventListener('keydown', close); return () => removeEventListener('keydown', close); }, [select]);

  const locate = () => {
    if (!navigator.geolocation) { setMapError('This browser does not expose geolocation. The simulation remains fully available.'); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      useAppStore.getState().updateGuardianLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
      mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 17 });
    }, () => setMapError('Location was not shared. The Ramkund demo location is still active.'), { enableHighAccuracy: true });
  };

  return <div className="page map-page"><PageHeading eyebrow="Ramkund private map" title={reunionMemberId ? 'Reunion, made clear.' : 'Your family on the real map.'} copy="OSM-derived geography with a precise 50m safety circle. Family positions are private to this session."/>
    {urgent && <div className={`map-alert ${urgent.status === 'sos' ? 'sos' : ''}`}><ShieldAlert/><div><strong>{urgent.name} needs help</strong><span>{Math.round(urgent.distance)}m away · {urgent.status}</span></div><Button variant="secondary" onClick={() => startReunion(urgent.id)}>Start reunion <Navigation/></Button></div>}
    <section className="map-workspace real-workspace"><div className="map-canvas-wrap"><div ref={container} className="event-map real-map" aria-label="Interactive family map of Ramkund, Nashik"/>
      <div className="map-controls"><button onClick={locate} title="Use my real location"><Crosshair/></button><button onClick={() => mapRef.current?.fitBounds(mapConfig.bounds, { padding: 50 })} title="Fit event area"><LocateFixed/></button><button onClick={() => mapRef.current?.flyTo({ center: mapConfig.center, zoom: mapConfig.defaultZoom })} title="Center Ramkund"><MapPin/></button></div>
      <div className="map-source-chip"><strong>RAMKUND · NASHIK</strong><span>PMTiles / OSM geography</span></div>
      {mapError && <><CoordinateFallback members={members}/><button className="tile-notice" onClick={() => setMapError('')}>{mapError} · dismiss</button></>}
      <div className="map-legend"><span><i className="safe"/>Safe</span><span><i className="warning"/>Warning</span><span><i className="separated"/>Separated</span><span><i className="sos"/>SOS</span></div>
    </div>
    <AnimatePresence mode="wait">{selected ? <MemberPanel key={selected.id} member={selected} close={() => select(null)}/> : <MapSummary members={members}/>}</AnimatePresence></section>
    <section className={`mobile-map-sheet snap-${sheetSnap}`} aria-label="Family map details"><button className="sheet-handle" aria-label="Change panel height" onClick={() => setSheetSnap(sheetSnap === 'peek' ? 'half' : sheetSnap === 'half' ? 'full' : 'peek')}/><div className="sheet-tabs"><button className={!selected ? 'active' : ''} onClick={() => select(null)}>Family</button>{selected && <button className="active">{selected.name}</button>}<span>{sheetSnap}</span></div>{selected ? <MemberPanel member={selected} close={() => select(null)}/> : <MapSummary members={members}/>}</section>
  </div>;
}

function CoordinateFallback({ members }: { members: FamilyMember[] }) {
  const [west, south, east, north] = mapConfig.bounds;
  return <div className="coordinate-fallback"><div className="coordinate-grid"/><div className="verified-anchor"><MapPin/><strong>Ramkund</strong><span>20.005556, 73.794167</span></div>{members.map((member) => { const left = (member.position.lng - west) / (east - west) * 100; const top = (north - member.position.lat) / (north - south) * 100; return <button key={member.id} style={{ left: `${left}%`, top: `${top}%`, background: statusColor[member.status] }} onClick={() => useAppStore.getState().selectMember(member.id)} aria-label={`${member.name}, ${member.status}`}><span>{member.name[0]}</span><small>{member.name}</small></button>; })}<p>Verified coordinate overlay · basemap unavailable</p></div>;
}

function MemberPanel({ member, close }: { member: FamilyMember; close(): void }) {
  return <motion.aside className="member-panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}><button className="panel-close" onClick={close} aria-label="Close details"><X/></button><div className="member-panel-head"><Avatar name={member.name} tone={member.status}/><div><span>{member.relation}</span><h2>{member.name}</h2><StatusBadge status={member.status}/></div></div><div className="device-reality">{member.reality === 'simulated' ? 'SIMULATED DEVICE' : member.reality === 'real' ? 'REAL BLE DEVICE' : 'PHONE'}<span>{member.deviceName}</span></div><dl className="detail-grid"><div><dt>Distance</dt><dd>{Math.round(member.distance)} metres</dd></div><div><dt>Accuracy</dt><dd>±{Math.round(member.position.accuracy)}m</dd></div><div><dt>Battery</dt><dd><BatteryMedium/>{member.battery}%</dd></div><div><dt>Connection</dt><dd><Signal/>{member.connection}</dd></div><div><dt>Heartbeat age</dt><dd>{Math.round(member.heartbeatAgeMs / 1000)}s</dd></div><div><dt>Coordinates</dt><dd>{member.position.lat.toFixed(5)}, {member.position.lng.toFixed(5)}</dd></div></dl><div className="panel-actions"><Button variant="violet" onClick={() => useAppStore.getState().startReunion(member.id)}><Navigation/> Start reunion</Button>{member.reality === 'simulated' && <Button variant="danger" onClick={() => useAppStore.getState().setDemoStep(5)}>Simulate SOS</Button>}</div></motion.aside>;
}

function MapSummary({ members }: { members: FamilyMember[] }) {
  return <motion.aside className="member-panel summary-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p className="eyebrow"><span/> Live family</p><h2>{members.every((member) => member.status === 'safe') ? 'Everyone is close.' : 'Stay aware.'}</h2><p>Select a map marker for its raw device facts and derived safety state.</p><div className="mini-network">{members.map((member) => <button key={member.id} onClick={() => useAppStore.getState().selectMember(member.id)}><span className={`mini-dot status-${member.status}`}>{member.deviceKind === 'band' ? <Radio/> : <Phone/>}</span><div><strong>{member.name}</strong><small>{Math.round(member.distance)}m · {member.status}</small></div></button>)}</div></motion.aside>;
}
