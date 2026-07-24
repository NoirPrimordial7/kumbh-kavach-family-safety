import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
} from 'maplibre-gl';
import { FileSource, PMTiles } from 'pmtiles';
import { circle, featureCollection, lineString, point } from '@turf/turf';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldAlert,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapConfig } from '@/config/mapConfig';
import {
  baseMapCandidates,
  nextMapSourceIndex,
  pmtilesVectorStyle,
  type MapSourceCandidate,
} from '@/services/mapSourceService';
import { offlineMapService } from '@/services/offlineMapService';
import {
  acquirePmtilesProtocol,
  releasePmtilesProtocol,
} from '@/services/pmtilesProtocolService';
import { useAppStore } from '@/stores/useAppStore';
import type { FamilyMember } from '@/types/domain';
import { mapPadding, snapFromDrag, type SheetSnap } from './mapLayout';
import { MapMemberPanel } from './MapMemberPanel';
import { MapQuickRange } from './MapQuickRange';
import { MapSummary } from './MapSummary';

const statusColor: Record<string, string> = {
  safe: '#38a169',
  reunited: '#38a169',
  warning: '#f2c94c',
  separated: '#ef5a36',
  sos: '#a62cce',
  offline: '#8a8a82',
};

const memberData = (members: FamilyMember[]) => featureCollection(
  members.map((member) => point(
    [member.position.lng, member.position.lat],
    {
      id: member.id,
      name: member.name,
      initials: member.name.split(' ').map((part) => part[0]).join('').slice(0, 2),
      status: member.status,
      color: statusColor[member.status],
    },
  )),
);

function installFamilyLayers(
  map: MapLibreMap,
  members: FamilyMember[],
  safeRadiusMeters: number,
  reunionRadiusMeters: number,
  reunionPoint: [number, number],
) {
  const guardian = members.find((member) => member.id === 'guardian-phone');
  if (!guardian || map.getSource('family-members')) return;
  map.addSource('safe-radius', {
    type: 'geojson',
    data: circle(
      [guardian.position.lng, guardian.position.lat],
      safeRadiusMeters,
      { steps: 72, units: 'meters' },
    ),
  });
  map.addLayer({
    id: 'safe-radius-fill',
    type: 'fill',
    source: 'safe-radius',
    paint: { 'fill-color': '#38a169', 'fill-opacity': 0.1 },
  });
  map.addLayer({
    id: 'safe-radius-line',
    type: 'line',
    source: 'safe-radius',
    paint: { 'line-color': '#208248', 'line-width': 2.5, 'line-dasharray': [3, 2] },
  });
  map.addSource('reunion-radius', {
    type: 'geojson',
    data: circle(reunionPoint, reunionRadiusMeters, { steps: 64, units: 'meters' }),
  });
  map.addLayer({
    id: 'reunion-radius-fill',
    type: 'fill',
    source: 'reunion-radius',
    paint: { 'fill-color': '#6c4dff', 'fill-opacity': 0.08 },
  });
  map.addLayer({
    id: 'reunion-radius-line',
    type: 'line',
    source: 'reunion-radius',
    paint: { 'line-color': '#6c4dff', 'line-width': 2, 'line-dasharray': [2, 2] },
  });
  map.addSource('reunion-point', {
    type: 'geojson',
    data: point(reunionPoint),
  });
  map.addLayer({
    id: 'reunion-point',
    type: 'circle',
    source: 'reunion-point',
    paint: {
      'circle-radius': 8,
      'circle-color': '#6c4dff',
      'circle-stroke-color': '#fffdf7',
      'circle-stroke-width': 4,
    },
  });
  map.addSource('family-members', { type: 'geojson', data: memberData(members) });
  map.addLayer({
    id: 'member-halo',
    type: 'circle',
    source: 'family-members',
    paint: {
      'circle-radius': ['match', ['get', 'status'], 'sos', 24, 'separated', 21, 18],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.18,
    },
  });
  map.addLayer({
    id: 'member-rings',
    type: 'circle',
    source: 'family-members',
    paint: {
      'circle-radius': 14,
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#fffdf7',
      'circle-stroke-width': 4,
    },
  });
  if (map.getStyle().glyphs) {
    map.addLayer({
      id: 'member-initials',
      type: 'symbol',
      source: 'family-members',
      layout: {
        'text-field': ['get', 'initials'],
        'text-size': 9,
        'text-font': ['Noto Sans Regular'],
        'text-allow-overlap': true,
      },
      paint: { 'text-color': '#101010' },
    });
    map.addLayer({
      id: 'member-labels',
      type: 'symbol',
      source: 'family-members',
      layout: {
        'text-field': ['concat', ['get', 'name'], ' · ', ['upcase', ['get', 'status']]],
        'text-size': 11,
        'text-font': ['Noto Sans Regular'],
        'text-offset': [0, 2.25],
        'text-anchor': 'top',
        'text-optional': true,
        'text-padding': 8,
      },
      paint: {
        'text-color': '#101010',
        'text-halo-color': '#fffdf7',
        'text-halo-width': 2,
      },
    });
  }
  map.on('click', 'member-rings', (event) => {
    const id = event.features?.[0]?.properties?.id as string | undefined;
    if (id) useAppStore.getState().selectMember(id);
  });
}

export function LiveMapPage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dragStart = useRef(0);
  const choosingPoint = useRef(false);
  const members = useAppStore((state) => state.members);
  const selectedId = useAppStore((state) => state.selectedMemberId);
  const select = useAppStore((state) => state.selectMember);
  const reunionMemberId = useAppStore((state) => state.reunionMemberId);
  const reunionPoint = useAppStore((state) => state.reunionPoint);
  const config = useAppStore((state) => state.safetyConfig);
  const mapMode = useAppStore((state) => state.mapMode);
  const [candidates, setCandidates] = useState<MapSourceCandidate[]>(() => baseMapCandidates());
  const [sourceIndex, setSourceIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [terminalError, setTerminalError] = useState(false);
  const [retryUsed, setRetryUsed] = useState(false);
  const [choosePoint, setChoosePoint] = useState(false);
  const [mobile, setMobile] = useState(matchMedia('(max-width: 880px)').matches);
  const selected = members.find((member) => member.id === selectedId) ?? null;
  const guardian = members.find((member) => member.id === 'guardian-phone');
  const urgent = members.find((member) =>
    member.status === 'sos' || member.status === 'separated');
  const data = useMemo(() => memberData(members), [members]);
  const source = candidates[sourceIndex];
  const isFallback = source?.id === 'fallback';

  useEffect(() => { choosingPoint.current = choosePoint; }, [choosePoint]);
  useEffect(() => {
    const media = matchMedia('(max-width: 880px)');
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const installed = await offlineMapService.isInstalled();
      if (!installed) {
        if (active && mapMode === 'offline') {
          const next = baseMapCandidates();
          setCandidates(next);
          setSourceIndex(next.findIndex((item) => item.id === 'fallback'));
        }
        return;
      }
      const file = await offlineMapService.getFile();
      const protocol = acquirePmtilesProtocol();
      protocol.add(new PMTiles(new FileSource(file)));
      releasePmtilesProtocol();
      if (active) {
        const next = baseMapCandidates(pmtilesVectorStyle(file.name, 'Downloaded Ramkund map'));
        setCandidates(next);
        setSourceIndex(mapMode === 'offline'
          ? next.findIndex((item) => item.id === 'offline')
          : 0);
      }
    })().catch((error) => {
      if (mapConfig.diagnostics) console.warn('Offline map discovery failed', error);
    });
    return () => { active = false; };
  }, [mapMode]);

  useEffect(() => {
    if (!container.current || !source) return;
    acquirePmtilesProtocol();
    let loaded = false;
    let switched = false;
    const fail = (error?: unknown) => {
      if (loaded || switched) return;
      switched = true;
      if (mapConfig.diagnostics && error) console.warn(`Map source ${source.id} failed`, error);
      const next = nextMapSourceIndex(sourceIndex, candidates.length);
      if (next >= 0) setSourceIndex(next);
      else setTerminalError(true);
    };
    const map = new maplibregl.Map({
      container: container.current,
      style: source.style,
      center: mapConfig.center,
      zoom: mapConfig.defaultZoom,
      minZoom: mapConfig.minZoom,
      maxZoom: mapConfig.maxZoom,
      maxBounds: mapConfig.bounds,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 100 }), 'bottom-left');
    const timer = window.setTimeout(() => fail(new Error('Map source load timeout')), 7_000);
    map.once('load', () => {
      loaded = true;
      clearTimeout(timer);
      installFamilyLayers(
        map,
        useAppStore.getState().members,
        useAppStore.getState().safetyConfig.safeRadiusMeters,
        useAppStore.getState().safetyConfig.reunionRadiusMeters,
        [useAppStore.getState().reunionPoint.lng, useAppStore.getState().reunionPoint.lat],
      );
      map.resize();
    });
    map.on('click', (event) => {
      if (!choosingPoint.current) return;
      useAppStore.getState().setReunionPoint(event.lngLat.lat, event.lngLat.lng);
      choosingPoint.current = false;
      setChoosePoint(false);
    });
    map.on('error', (event) => {
      if (!loaded) fail(event.error);
      else if (mapConfig.diagnostics) console.warn(`Non-fatal map error from ${source.id}`, event.error);
    });
    mapRef.current = map;
    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      releasePmtilesProtocol();
    };
  }, [candidates, source, sourceIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    (map.getSource('family-members') as GeoJSONSource | undefined)?.setData(data);
    if (guardian) {
      (map.getSource('safe-radius') as GeoJSONSource | undefined)?.setData(
        circle(
          [guardian.position.lng, guardian.position.lat],
          config.safeRadiusMeters,
          { steps: 72, units: 'meters' },
        ),
      );
    }
    (map.getSource('reunion-radius') as GeoJSONSource | undefined)?.setData(
      circle(
        [reunionPoint.lng, reunionPoint.lat],
        config.reunionRadiusMeters,
        { steps: 64, units: 'meters' },
      ),
    );
    (map.getSource('reunion-point') as GeoJSONSource | undefined)?.setData(
      point([reunionPoint.lng, reunionPoint.lat]),
    );
    if (map.getLayer('reunion-line')) map.removeLayer('reunion-line');
    if (map.getSource('reunion-line')) map.removeSource('reunion-line');
    const target = members.find((member) => member.id === reunionMemberId);
    if (guardian && target) {
      map.addSource('reunion-line', {
        type: 'geojson',
        data: featureCollection([
          lineString([
            [guardian.position.lng, guardian.position.lat],
            [reunionPoint.lng, reunionPoint.lat],
          ], { role: 'guardian' }),
          lineString([
            [target.position.lng, target.position.lat],
            [reunionPoint.lng, reunionPoint.lat],
          ], { role: 'member' }),
        ]),
      });
      map.addLayer({
        id: 'reunion-line',
        type: 'line',
        source: 'reunion-line',
        paint: {
          'line-color': ['match', ['get', 'role'], 'guardian', '#146cff', '#6c4dff'],
          'line-width': 4,
          'line-dasharray': [2, 2],
        },
      });
    }
  }, [config, data, guardian, members, reunionMemberId, reunionPoint]);

  useEffect(() => {
    const map = mapRef.current;
    const element = container.current;
    if (!map || !element) return;
    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.resize());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    addEventListener('resize', resize);
    addEventListener('fullscreenchange', resize);
    void document.fonts?.ready.then(resize);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('resize', resize);
      removeEventListener('fullscreenchange', resize);
    };
  }, [sourceIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const id = requestAnimationFrame(() => {
      map.resize();
      if (guardian) {
        map.easeTo({
          center: [guardian.position.lng, guardian.position.lat],
          padding: mapPadding(panelOpen, mobile, sheetSnap),
          duration: 350,
        });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [guardian, mobile, panelOpen, sheetSnap]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        select(null);
        setChoosePoint(false);
      }
    };
    addEventListener('keydown', close);
    return () => removeEventListener('keydown', close);
  }, [select]);

  const locate = () => {
    if (!navigator.geolocation) {
      useAppStore.getState().addActivity('Geolocation is unavailable; demo coordinates remain active.', 'location');
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      useAppStore.getState().updateGuardianLocation(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy,
      );
      mapRef.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 17,
      });
    }, () => {
      useAppStore.getState().addActivity('Location permission denied; demo coordinates remain active.', 'location');
    });
  };
  const chooseMember = (id: string) => {
    select(id);
    setPanelOpen(true);
    setSheetSnap('half');
  };
  const fitFamily = () => {
    if (!members.length) return;
    const bounds = new maplibregl.LngLatBounds();
    members.forEach((member) => bounds.extend([member.position.lng, member.position.lat]));
    bounds.extend([reunionPoint.lng, reunionPoint.lat]);
    mapRef.current?.fitBounds(bounds, {
      padding: mapPadding(panelOpen, mobile, sheetSnap),
      maxZoom: 18,
    });
  };
  const retry = () => {
    if (retryUsed) return;
    setRetryUsed(true);
    setTerminalError(false);
    setSourceIndex(0);
  };

  return <div className={`immersive-map-page ${choosePoint ? 'choosing-reunion-point' : ''}`}>
    <header className="map-topbar">
      <div>
        <span className="map-live-dot"/>
        <strong>Family live map</strong>
        <small>Ramkund · Nashik</small>
        {reunionMemberId && <b className="reunion-active-chip">REUNION ACTIVE</b>}
      </div>
      <span className={`source-badge source-${source?.badge.toLowerCase().replace(' ', '-')}`}>
        {source?.badge ?? 'MAP'}
      </span>
    </header>
    {urgent && <div className={`compact-map-alert ${urgent.status}`} role="status">
      <ShieldAlert/>
      <strong>{urgent.name}: {urgent.status.toUpperCase()}</strong>
      <span>{Math.round(urgent.distance)}m away</span>
      <button onClick={() => useAppStore.getState().startReunion(urgent.id)}>Start reunion</button>
    </div>}
    <section className={`immersive-map-shell ${panelOpen ? 'panel-open' : 'panel-closed'}`}>
      <div className="immersive-map-canvas">
        <div ref={container} className="event-map" aria-label="Interactive family map of Ramkund, Nashik"/>
        <div className="map-controls">
          <button onClick={locate} aria-label="Use my location"><Crosshair/></button>
          <button onClick={fitFamily} aria-label="Fit family and reunion point"><LocateFixed/></button>
          <button onClick={() => mapRef.current?.flyTo({ center: mapConfig.center, zoom: mapConfig.defaultZoom })} aria-label="Center Ramkund"><MapPin/></button>
          <button
            className={choosePoint ? 'active' : ''}
            onClick={() => setChoosePoint((value) => !value)}
            aria-pressed={choosePoint}
            aria-label="Select reunion point on map"
          ><Navigation/></button>
        </div>
        <MapQuickRange/>
        <div className="radius-label">
          {config.safeRadiusMeters}m safe · {config.reunionRadiusMeters}m reunion
        </div>
        <div className="map-legend">
          <span><i className="safe"/>Safe</span>
          <span><i className="warning"/>Warning</span>
          <span><i className="separated"/>Separated</span>
          <span><i className="sos"/>SOS</span>
        </div>
        {choosePoint && <div className="map-action-hint" role="status">
          Select a clear meeting point on the map · Escape to cancel
        </div>}
        {isFallback && <div className="offline-coordinate-notice" role="status">
          <strong>Offline coordinate map – detailed basemap unavailable</strong>
          <span>{guardian?.position.lat.toFixed(5)}, {guardian?.position.lng.toFixed(5)}</span>
          {!retryUsed && <button onClick={retry}>Retry Map</button>}
        </div>}
        {terminalError && <div className="map-terminal-error" role="alert">
          <strong>Map temporarily unavailable</strong>
          <span>Family status and last known locations remain available.</span>
          {!retryUsed && <button onClick={retry}>Retry Map</button>}
        </div>}
        <div className="mobile-member-carousel">
          {members.map((member) => <button
            key={member.id}
            className={selectedId === member.id ? 'active' : ''}
            onClick={() => chooseMember(member.id)}
          >
            <i style={{ background: statusColor[member.status] }}/>
            <span><strong>{member.name.split(' ')[0]}</strong><small>{Math.round(member.distance)}m</small></span>
          </button>)}
        </div>
      </div>
      <button
        className="panel-toggle"
        onClick={() => setPanelOpen((value) => !value)}
        aria-label={panelOpen ? 'Collapse member panel' : 'Open member panel'}
      >{panelOpen ? <ChevronRight/> : <ChevronLeft/>}</button>
      <AnimatePresence mode="wait">
        {panelOpen && (selected
          ? <MapMemberPanel key={selected.id} member={selected} close={() => select(null)}/>
          : <MapSummary key="summary" members={members} choose={chooseMember}/>)}
      </AnimatePresence>
    </section>
    <section className={`mobile-map-sheet snap-${sheetSnap}`} aria-label="Map details">
      <button
        className="sheet-handle"
        aria-label="Drag map details"
        onPointerDown={(event) => {
          dragStart.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) =>
          setSheetSnap((snap) => snapFromDrag(snap, event.clientY - dragStart.current))}
      />
      <div className="sheet-tabs">
        <strong>{selected?.name ?? 'Family status'}</strong>
        <button onClick={() => setSheetSnap(
          sheetSnap === 'peek' ? 'half' : sheetSnap === 'half' ? 'full' : 'peek',
        )}>{sheetSnap}</button>
      </div>
      {selected
        ? <MapMemberPanel member={selected} close={() => select(null)}/>
        : <MapSummary members={members} choose={chooseMember}/>}
    </section>
  </div>;
}
