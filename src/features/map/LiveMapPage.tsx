import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl';
import { FileSource, PMTiles, Protocol } from 'pmtiles';
import { circle, featureCollection, lineString, point } from '@turf/turf';
import { BatteryMedium, ChevronLeft, ChevronRight, Crosshair, LocateFixed, MapPin, Navigation, Phone, Radio, ShieldAlert, Signal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Avatar, StatusBadge } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { mapConfig } from '@/config/mapConfig';
import { baseMapCandidates, nextMapSourceIndex, type MapSourceCandidate } from '@/services/mapSourceService';
import { offlineMapService } from '@/services/offlineMapService';
import { useAppStore } from '@/stores/useAppStore';
import type { FamilyMember } from '@/types/domain';
import { mapPadding, snapFromDrag, type SheetSnap } from './mapLayout';

const protocol = new Protocol();
let protocolRegistered = false;
const statusColor: Record<string, string> = { safe: '#38a169', reunited: '#38a169', warning: '#f2c94c', separated: '#ef5a36', sos: '#a62cce', offline: '#8a8a82' };

const offlineStyle = (archiveName: string): StyleSpecification => ({
  version: 8, name: 'Offline Ramkund', glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
  sources: { map: { type: 'vector', url: `pmtiles://${archiveName}`, attribution: mapConfig.attribution } },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': '#e9e4d7' } },
    { id: 'water', type: 'fill', source: 'map', 'source-layer': 'water', paint: { 'fill-color': '#8fd4e8' } },
    { id: 'buildings', type: 'fill', source: 'map', 'source-layer': 'buildings', minzoom: 14, paint: { 'fill-color': '#d3ccbd' } },
    { id: 'roads', type: 'line', source: 'map', 'source-layer': 'roads', paint: { 'line-color': '#fffdf7', 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 17, 5] } },
  ],
});

const memberData = (members: FamilyMember[]) => featureCollection(members.map((member) => point([member.position.lng, member.position.lat], { id: member.id, name: member.name, initials: member.name.split(' ').map((part) => part[0]).join('').slice(0, 2), status: member.status, color: statusColor[member.status] })));

function installFamilyLayers(map: MapLibreMap, members: FamilyMember[]) {
  const guardian = members.find((member) => member.id === 'guardian-phone');
  if (!guardian || map.getSource('family-members')) return;
  map.addSource('safe-radius', { type: 'geojson', data: circle([guardian.position.lng, guardian.position.lat], 50, { steps: 72, units: 'meters' }) });
  map.addLayer({ id: 'safe-radius-fill', type: 'fill', source: 'safe-radius', paint: { 'fill-color': '#38a169', 'fill-opacity': 0.1 } });
  map.addLayer({ id: 'safe-radius-line', type: 'line', source: 'safe-radius', paint: { 'line-color': '#208248', 'line-width': 2.5, 'line-dasharray': [3, 2] } });
  map.addSource('family-members', { type: 'geojson', data: memberData(members) });
  map.addLayer({ id: 'member-halo', type: 'circle', source: 'family-members', paint: { 'circle-radius': ['match', ['get', 'status'], 'sos', 24, 'separated', 21, 18], 'circle-color': ['get', 'color'], 'circle-opacity': 0.18 } });
  map.addLayer({ id: 'member-rings', type: 'circle', source: 'family-members', paint: { 'circle-radius': 14, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fffdf7', 'circle-stroke-width': 4 } });
  if (map.getStyle().glyphs) {
    map.addLayer({ id: 'member-initials', type: 'symbol', source: 'family-members', layout: { 'text-field': ['get', 'initials'], 'text-size': 9, 'text-font': ['Noto Sans Regular'], 'text-allow-overlap': true }, paint: { 'text-color': '#101010' } });
    map.addLayer({ id: 'member-labels', type: 'symbol', source: 'family-members', layout: { 'text-field': ['concat', ['get', 'name'], '  ·  ', ['upcase', ['get', 'status']]], 'text-size': 11, 'text-font': ['Noto Sans Regular'], 'text-offset': [0, 2.25], 'text-anchor': 'top', 'text-optional': true, 'text-padding': 8 }, paint: { 'text-color': '#101010', 'text-halo-color': '#fffdf7', 'text-halo-width': 2 } });
  }
  map.on('click', 'member-rings', (event) => { const id = event.features?.[0]?.properties?.id as string | undefined; if (id) useAppStore.getState().selectMember(id); });
}

export function LiveMapPage() {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<MapLibreMap | null>(null); const dragStart = useRef(0);
  const members = useAppStore((state) => state.members); const selectedId = useAppStore((state) => state.selectedMemberId); const select = useAppStore((state) => state.selectMember); const reunionMemberId = useAppStore((state) => state.reunionMemberId);
  const mapMode = useAppStore((state) => state.mapMode);
  const [candidates, setCandidates] = useState<MapSourceCandidate[]>(() => baseMapCandidates()); const [sourceIndex, setSourceIndex] = useState(0); const [panelOpen, setPanelOpen] = useState(true); const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek'); const [terminalError, setTerminalError] = useState(false); const [mobile, setMobile] = useState(matchMedia('(max-width: 880px)').matches);
  const selected = members.find((member) => member.id === selectedId) ?? null; const guardian = members.find((member) => member.id === 'guardian-phone'); const urgent = members.find((member) => member.status === 'sos' || member.status === 'separated'); const data = useMemo(() => memberData(members), [members]); const source = candidates[sourceIndex];

  useEffect(() => { const media = matchMedia('(max-width: 880px)'); const update = () => setMobile(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { let active = true; void (async () => { if (!await offlineMapService.isInstalled()) return; const file = await offlineMapService.getFile(); const archive = new PMTiles(new FileSource(file)); protocol.add(archive); if (active) { const next = baseMapCandidates(offlineStyle(file.name)); setCandidates(next); setSourceIndex(mapMode === 'offline' ? next.findIndex((item) => item.id === 'offline') : 0); } })(); return () => { active = false; }; }, [mapMode]);

  useEffect(() => {
    if (!container.current || !source) return;
    if (!protocolRegistered) { maplibregl.addProtocol('pmtiles', protocol.tile); protocolRegistered = true; }
    let loaded = false; let switched = false;
    const fail = () => { if (loaded || switched) return; switched = true; const next = nextMapSourceIndex(sourceIndex, candidates.length); if (next >= 0) setSourceIndex(next); else setTerminalError(true); };
    const map = new maplibregl.Map({ container: container.current, style: source.style, center: mapConfig.center, zoom: mapConfig.defaultZoom, minZoom: mapConfig.minZoom, maxZoom: mapConfig.maxZoom, maxBounds: mapConfig.bounds, attributionControl: false });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    const timer = window.setTimeout(fail, 7000);
    map.once('load', () => { loaded = true; clearTimeout(timer); installFamilyLayers(map, useAppStore.getState().members); map.resize(); });
    map.on('error', () => { if (!loaded) fail(); }); mapRef.current = map;
    return () => { clearTimeout(timer); map.remove(); mapRef.current = null; };
  }, [candidates, source, sourceIndex]);

  useEffect(() => {
    const map = mapRef.current; if (!map?.isStyleLoaded()) return;
    (map.getSource('family-members') as GeoJSONSource | undefined)?.setData(data);
    if (guardian) (map.getSource('safe-radius') as GeoJSONSource | undefined)?.setData(circle([guardian.position.lng, guardian.position.lat], 50, { steps: 72, units: 'meters' }));
    if (map.getLayer('reunion-line')) map.removeLayer('reunion-line'); if (map.getSource('reunion-line')) map.removeSource('reunion-line');
    const target = members.find((member) => member.id === reunionMemberId);
    if (guardian && target) { map.addSource('reunion-line', { type: 'geojson', data: lineString([[guardian.position.lng, guardian.position.lat], [target.position.lng, target.position.lat]]) }); map.addLayer({ id: 'reunion-line', type: 'line', source: 'reunion-line', paint: { 'line-color': '#6c4dff', 'line-width': 4, 'line-dasharray': [2, 2] } }); }
  }, [data, guardian, members, reunionMemberId]);

  useEffect(() => { const map = mapRef.current; if (!map) return; const id = requestAnimationFrame(() => { map.resize(); if (guardian) map.easeTo({ center: [guardian.position.lng, guardian.position.lat], padding: mapPadding(panelOpen, mobile, sheetSnap), duration: 350 }); }); return () => cancelAnimationFrame(id); }, [guardian, mobile, panelOpen, sheetSnap]);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') select(null); }; addEventListener('keydown', close); return () => removeEventListener('keydown', close); }, [select]);

  const locate = () => { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition((position) => { useAppStore.getState().updateGuardianLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy); mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 17 }); }); };
  const chooseMember = (id: string) => { select(id); setPanelOpen(true); setSheetSnap('half'); };

  return <div className="immersive-map-page">
    <header className="map-topbar"><div><span className="map-live-dot"/><strong>Family live map</strong><small>Ramkund · Nashik</small>{reunionMemberId && <b className="reunion-active-chip">REUNION ACTIVE</b>}</div><span className={`source-badge source-${source?.badge.toLowerCase().replace(' ', '-')}`}>{source?.badge ?? 'MAP'}</span></header>
    {urgent && <div className={`compact-map-alert ${urgent.status}`}><ShieldAlert/><strong>{urgent.name}: {urgent.status.toUpperCase()}</strong><span>{Math.round(urgent.distance)}m away</span><button onClick={() => useAppStore.getState().startReunion(urgent.id)}>Start reunion</button></div>}
    <section className={`immersive-map-shell ${panelOpen ? 'panel-open' : 'panel-closed'}`}>
      <div className="immersive-map-canvas"><div ref={container} className="event-map" aria-label="Interactive family map of Ramkund, Nashik"/>
        <div className="map-controls"><button onClick={locate} title="Use my location"><Crosshair/></button><button onClick={() => mapRef.current?.fitBounds(mapConfig.bounds, { padding: mapPadding(panelOpen, mobile, sheetSnap) })} title="Fit event area"><LocateFixed/></button><button onClick={() => mapRef.current?.flyTo({ center: mapConfig.center, zoom: mapConfig.defaultZoom })} title="Center Ramkund"><MapPin/></button></div>
        <div className="radius-label">50m family safety radius</div><div className="map-legend"><span><i className="safe"/>Safe</span><span><i className="warning"/>Warning</span><span><i className="separated"/>Separated</span><span><i className="sos"/>SOS</span></div>
        {terminalError && <div className="map-terminal-error"><strong>Map temporarily unavailable</strong><span>Family status and last known locations remain available.</span><button onClick={() => { setTerminalError(false); setSourceIndex(0); }}>Retry</button></div>}
        <div className="mobile-member-carousel">{members.map((member) => <button key={member.id} className={selectedId === member.id ? 'active' : ''} onClick={() => chooseMember(member.id)}><i style={{ background: statusColor[member.status] }}/><span><strong>{member.name.split(' ')[0]}</strong><small>{Math.round(member.distance)}m</small></span></button>)}</div>
      </div>
      <button className="panel-toggle" onClick={() => setPanelOpen((value) => !value)} aria-label={panelOpen ? 'Collapse member panel' : 'Open member panel'}>{panelOpen ? <ChevronRight/> : <ChevronLeft/>}</button>
      <AnimatePresence mode="wait">{panelOpen && (selected ? <MemberPanel key={selected.id} member={selected} close={() => select(null)}/> : <MapSummary key="summary" members={members} choose={chooseMember}/>)}</AnimatePresence>
    </section>
    <section className={`mobile-map-sheet snap-${sheetSnap}`}><button className="sheet-handle" aria-label="Drag map details" onPointerDown={(event) => { dragStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={(event) => setSheetSnap((snap) => snapFromDrag(snap, event.clientY - dragStart.current))}/><div className="sheet-tabs"><strong>{selected?.name ?? 'Family status'}</strong><button onClick={() => setSheetSnap(sheetSnap === 'peek' ? 'half' : sheetSnap === 'half' ? 'full' : 'peek')}>{sheetSnap}</button></div>{selected ? <MemberPanel member={selected} close={() => select(null)}/> : <MapSummary members={members} choose={chooseMember}/>}</section>
  </div>;
}

function MemberPanel({ member, close }: { member: FamilyMember; close(): void }) {
  const activeReunion = useAppStore((state) => state.reunionMemberId === member.id); const eligible = useAppStore((state) => state.reunionEligibleIds.includes(member.id)); const acknowledged = useAppStore((state) => state.acknowledgedSosIds.includes(member.id));
  return <motion.aside className="member-panel" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}><button className="panel-close" onClick={close} aria-label="Close details"><X/></button><div className="member-panel-head"><Avatar name={member.name} tone={member.status}/><div><span>{member.relation}</span><h2>{member.name}</h2><StatusBadge status={member.status}/></div></div><div className="device-reality">{member.reality === 'simulated' ? 'SIMULATED DEVICE' : member.reality === 'real' ? 'REAL BLE DEVICE' : 'PHONE'}<span>{member.deviceName}</span></div><dl className="detail-grid"><div><dt>Distance</dt><dd>{Math.round(member.distance)} metres</dd></div><div><dt>Accuracy</dt><dd>±{Math.round(member.position.accuracy)}m</dd></div><div><dt>Battery</dt><dd><BatteryMedium/>{member.battery}%</dd></div><div><dt>Connection</dt><dd><Signal/>{member.connection}</dd></div></dl><div className="panel-actions">{member.status === 'sos' && !acknowledged && <Button variant="violet" onClick={() => useAppStore.getState().acknowledge(member.id)}>Acknowledge SOS</Button>}{member.status === 'sos' && acknowledged && <Button variant="danger" onClick={() => useAppStore.getState().resolveAlert(member.id)}>Resolve SOS</Button>}<Button variant="violet" onClick={() => useAppStore.getState().startReunion(member.id)}><Navigation/> {activeReunion ? 'Reunion active' : 'Start reunion'}</Button>{activeReunion && eligible && member.distance <= 15 && member.status !== 'sos' && <Button onClick={() => useAppStore.getState().confirmReunion(member.id)}>Confirm reunited</Button>}</div><details className="technical-details"><summary>Technical details</summary><p>Heartbeat {Math.round(member.heartbeatAgeMs / 1000)}s · {member.position.lat.toFixed(5)}, {member.position.lng.toFixed(5)}</p><p>{member.reality} · {member.connection} · location accuracy ±{Math.round(member.position.accuracy)}m</p></details></motion.aside>;
}

function MapSummary({ members, choose }: { members: FamilyMember[]; choose(id: string): void }) {
  const safe = members.filter((member) => member.status === 'safe' || member.status === 'reunited').length;
  return <motion.aside className="member-panel summary-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p className="eyebrow"><span/>Live family</p><h2>{safe === members.length ? 'Everyone is close.' : 'Stay aware.'}</h2><p>Live safety status derived from the same distance and alert engine on every screen.</p><div className="mini-network">{members.map((member) => <button key={member.id} onClick={() => choose(member.id)}><span className={`mini-dot status-${member.status}`}>{member.deviceKind === 'band' ? <Radio/> : <Phone/>}</span><div><strong>{member.name}</strong><small>{Math.round(member.distance)}m · {member.status}</small></div></button>)}</div></motion.aside>;
}
