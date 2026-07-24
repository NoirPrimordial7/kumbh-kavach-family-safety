import { useEffect, useRef, useState } from 'react';
import {
  Bluetooth,
  Check,
  Cloud,
  Database,
  ExternalLink,
  Map,
  PauseCircle,
  PlayCircle,
  Radio,
  Shield,
  Smartphone,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/AppShell';
import { productConfig } from '@/config/brand';
import { useAppStore } from '@/stores/useAppStore';
import {
  watchLocation,
  type LocationPermissionState,
} from '@/services/geolocationService';
import {
  offlineMapMetadata,
  offlineMapService,
} from '@/services/offlineMapService';
import { SafetyRangeSettings } from './SafetyRangeSettings';

export function SettingsPage() {
  const session = useAppStore((state) => state.session)!;
  const mapMode = useAppStore((state) => state.mapMode);
  const [locationState, setLocationState] = useState<LocationPermissionState>('idle');
  const stopWatch = useRef<() => void>();
  const [offlineInstalled, setOfflineInstalled] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>();
  const [mapMessage, setMapMessage] = useState('');

  useEffect(() => {
    void offlineMapService.isInstalled().then(setOfflineInstalled);
    return () => stopWatch.current?.();
  }, []);

  function enableLocation() {
    stopWatch.current = watchLocation((position) => {
      useAppStore.getState().updateGuardianLocation(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy,
      );
    }, setLocationState);
  }

  async function installOfflineMap() {
    try {
      setMapMessage('Downloading bounded Ramkund archive…');
      await offlineMapService.download((progress) => setDownloadProgress(progress.percent));
      setOfflineInstalled(true);
      useAppStore.getState().setMapMode('offline');
      setMapMessage('Offline map installed in this browser.');
    } catch (error) {
      setMapMessage(error instanceof Error
        ? error.message
        : 'Offline map download failed. The coordinate fallback remains available.');
    }
  }

  return <div className="page settings-page">
    <PageHeading
      eyebrow="Privacy & settings"
      title="You’re in control."
      copy="Tracking is temporary, opt in, and visible only to this family."
    />
    <div className="settings-layout">
      <nav>
        <a href="#privacy">Privacy</a>
        <a href="#family">Safety ranges</a>
        <a href="#devices">Device connections</a>
        <a href="#map">Map & offline</a>
        <a href="#research">Research & simulation</a>
        <a href="#technical">Technical status</a>
      </nav>
      <div className="settings-sections">
        <SettingsSection
          id="privacy"
          icon={<Shield/>}
          title="Location privacy"
          copy="Only members of this private family can view shared positions. Nothing is shared with organisers or authorities by default."
        >
          <div className="tracking-control">
            <span className={session.trackingPaused ? 'paused' : ''}>
              <i/>{session.trackingPaused ? 'SHARING PAUSED' : 'TRACKING ACTIVE'}
            </span>
            <p>{session.trackingPaused
              ? 'Cached last-known positions remain visible.'
              : 'Family members can see current and last-known locations.'}</p>
            <Button
              variant={session.trackingPaused ? 'violet' : 'secondary'}
              onClick={() => useAppStore.getState().toggleSharing()}
            >
              {session.trackingPaused ? <PlayCircle/> : <PauseCircle/>}
              {session.trackingPaused ? 'Resume sharing' : 'Pause sharing'}
            </Button>
          </div>
          <div className="privacy-points">
            <span><Check/>Opt-in location only</span>
            <span><Check/>Automatic event expiry</span>
            <span><Check/>No public family maps</span>
          </div>
        </SettingsSection>
        <SettingsSection
          id="family"
          icon={<Radio/>}
          title="Safety and reunion ranges"
          copy="Guardian-approved values drive every map circle, member state, alert and deterministic demo position."
        >
          <SafetyRangeSettings/>
        </SettingsSection>
        <SettingsSection
          id="devices"
          icon={<Smartphone/>}
          title="This phone"
          copy="Browser location and Bluetooth are requested only after a clear user action."
        >
          <div className="permission-row">
            <span className={`permission-state state-${locationState}`}>
              <i/>{locationState === 'idle' ? 'Not requested' : locationState}
            </span>
            <Button
              onClick={enableLocation}
              disabled={locationState === 'waiting' || locationState === 'allowed'}
            >Enable location</Button>
          </div>
          <div className="capability-grid">
            <span><Bluetooth/><strong>REAL NOW · Web Bluetooth</strong>
              {navigator.bluetooth ? 'Available in this browser' : 'Unsupported · simulated fallback ready'}
            </span>
            <span><Cloud/><strong>REAL NOW · Firebase sync</strong>
              {productConfig.firebaseEnabled ? 'Configured' : 'Disabled · local demo mode'}
            </span>
          </div>
        </SettingsSection>
        <SettingsSection
          id="map"
          icon={<Map/>}
          title="Map and offline"
          copy="The same-origin Ramkund PMTiles archive supports byte ranges. OPFS installation is optional; the coordinate map is always bundled."
        >
          <div className="choice-row">
            <button
              className={offlineInstalled ? 'active' : ''}
              disabled={!offlineMapService.isSupported()}
              onClick={installOfflineMap}
            >
              <WifiOff/>
              <span>
                <strong>{offlineInstalled ? 'Offline area installed' : 'Install offline area'}</strong>
                {downloadProgress !== undefined
                  ? `${downloadProgress}% downloaded`
                  : `${offlineMapMetadata.version} · ${(offlineMapMetadata.approximateBytes / 1_000_000).toFixed(1)} MB`}
              </span>
            </button>
            <button
              className={mapMode === 'real' ? 'active' : ''}
              onClick={() => useAppStore.getState().setMapMode('real')}
            >
              <Map/><span><strong>Same-origin live map</strong>Regional Ramkund PMTiles</span>
            </button>
          </div>
          {mapMessage && <p className="technical-note" role="status">{mapMessage}</p>}
          {offlineInstalled && <Button variant="secondary" onClick={async () => {
            await offlineMapService.remove();
            setOfflineInstalled(false);
            setDownloadProgress(undefined);
            useAppStore.getState().setMapMode('real');
            setMapMessage('Offline map removed from this browser.');
          }}>Remove offline area</Button>}
        </SettingsSection>
        <SettingsSection
          id="research"
          icon={<Database/>}
          title="Research and Simulation"
          copy="The original Command Center is a separate future infrastructure concept. It is not the consumer family product."
        >
          <div className="research-card">
            <div><Radio/><span><small>LEGACY RESEARCH LAYER</small><strong>Crowd Command Center</strong></span></div>
            <p>The original dark simulation remains isolated from private family sessions.</p>
            <div>
              <Button onClick={() => location.assign('/simulation')}>Open Command Center <ExternalLink/></Button>
              <Button variant="secondary" onClick={() => location.assign('/simulation?scenario=lost-child')}>Lost child scenario</Button>
              <Button variant="secondary" onClick={() => location.assign('/simulation?scenario=crowd-surge')}>Crowd surge</Button>
            </div>
          </div>
        </SettingsSection>
        <SettingsSection
          id="technical"
          icon={<Cloud/>}
          title="Technical status"
          copy="A clear view of what is real, simulated, and planned."
        >
          <ul className="reality-list">
            <li><span className="real">REAL NOW</span>Responsive PWA, opt-in geolocation, same-origin PMTiles, direct Web Bluetooth and optional Firebase.</li>
            <li><span className="demo">SIMULATED NOW</span>Extra phones, bands, deterministic movement, separation, SOS and reunion.</li>
            <li><span className="future-tag">FUTURE NATIVE</span>Disconnected phone-to-phone exchange requires Android Nearby Connections.</li>
          </ul>
          <Button variant="secondary" onClick={() => void useAppStore.getState().clearApplicationCaches()}>
            Clear app caches and reset Demo Mode
          </Button>
        </SettingsSection>
        <section className="danger-zone">
          <Trash2/>
          <div><h2>End this event session</h2><p>Stops tracking and removes local session data from this browser.</p></div>
          <Button variant="danger" onClick={() => useAppStore.getState().endSession()}>
            End and delete session
          </Button>
        </section>
      </div>
    </div>
  </div>;
}

interface SettingsSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  copy: string;
  children: React.ReactNode;
}

function SettingsSection({
  id,
  icon,
  title,
  copy,
  children,
}: SettingsSectionProps) {
  return <section className="settings-section" id={id}>
    <header><span>{icon}</span><div><h2>{title}</h2><p>{copy}</p></div></header>
    {children}
  </section>;
}
