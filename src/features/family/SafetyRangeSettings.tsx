import { MapPin, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { warningThresholdMeters } from '@/domain/safety/safetyConfig';
import { useAppStore } from '@/stores/useAppStore';

interface RangeFieldProps {
  id: string;
  label: string;
  description: string;
  min: number;
  max: number;
  value: number;
  onChange(value: number): void;
}

function RangeField({
  id,
  label,
  description,
  min,
  max,
  value,
  onChange,
}: RangeFieldProps) {
  return <div className="range-field">
    <label htmlFor={`${id}-slider`}>{label}</label>
    <p id={`${id}-description`}>{description}</p>
    <div>
      <input
        id={`${id}-slider`}
        type="range"
        min={min}
        max={max}
        value={value}
        aria-describedby={`${id}-description`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <label className="numeric-range">
        <span className="sr-only">{label} numeric value</span>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          aria-describedby={`${id}-description`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>m</span>
      </label>
    </div>
  </div>;
}

export function SafetyRangeSettings() {
  const config = useAppStore((state) => state.safetyConfig);
  const error = useAppStore((state) => state.safetyConfigError);
  const update = useAppStore((state) => state.updateSafety);
  const reset = useAppStore((state) => state.resetSafety);
  const setPage = useAppStore((state) => state.setPage);
  const reunionPointSource = useAppStore((state) => state.reunionPointSource);

  return <div className="safety-range-settings">
    <fieldset className="range-presets">
      <legend>Safe-radius presets</legend>
      {[20, 50, 100].map((radius) => <button
        type="button"
        className={config.safeRadiusMeters === radius ? 'active' : ''}
        key={radius}
        onClick={() => update({ safeRadiusMeters: radius })}
      >
        <strong>{radius}m</strong>
        <span>{radius === 20 ? 'Very close' : radius === 50 ? 'Busy venue' : 'Large gathering'}</span>
      </button>)}
    </fieldset>
    <RangeField
      id="safe-radius"
      label="Custom safe radius"
      description="Allowed range: 5–1000 metres. Statuses and map geometry update immediately."
      min={5}
      max={1000}
      value={config.safeRadiusMeters}
      onChange={(value) => update({ safeRadiusMeters: value })}
    />
    <div className="range-preview">
      Warning begins at <strong>{Math.round(warningThresholdMeters(config))}m</strong>
      <span>{Math.round(config.warningRatio * 100)}% of the safe radius</span>
    </div>
    <RangeField
      id="reunion-radius"
      label="Reunion radius"
      description="Allowed range: 3–250 metres. Stable proximity is required before resolution."
      min={3}
      max={250}
      value={config.reunionRadiusMeters}
      onChange={(value) => update({ reunionRadiusMeters: value })}
    />
    <fieldset className="reunion-point-options">
      <legend>Reunion point</legend>
      <button
        type="button"
        className={reunionPointSource === 'guardian' ? 'active' : ''}
        onClick={() => useAppStore.getState().useGuardianAsReunionPoint()}
      >Use guardian location</button>
      <button
        type="button"
        className={reunionPointSource === 'custom' ? 'active' : ''}
        onClick={() => setPage('map')}
      ><MapPin/>Select directly on map</button>
    </fieldset>
    <details className="advanced-safety">
      <summary>Advanced safety timing</summary>
      <label>
        Warning ratio
        <input
          type="number"
          min="0.5"
          max="0.95"
          step="0.05"
          value={config.warningRatio}
          onChange={(event) => update({ warningRatio: Number(event.target.value) })}
        />
      </label>
      <label>
        Separation grace (seconds)
        <input
          type="number"
          min="0"
          max="60"
          value={config.separationGraceSeconds}
          onChange={(event) => update({ separationGraceSeconds: Number(event.target.value) })}
        />
      </label>
      <label>
        Stale timeout (seconds)
        <input
          type="number"
          min="5"
          max="600"
          value={config.staleTimeoutSeconds}
          onChange={(event) => update({ staleTimeoutSeconds: Number(event.target.value) })}
        />
      </label>
      <label>
        GPS accuracy buffer (metres)
        <input
          type="number"
          min="0"
          max="100"
          value={config.gpsAccuracyBufferMeters}
          onChange={(event) => update({ gpsAccuracyBufferMeters: Number(event.target.value) })}
        />
      </label>
      <label>
        Reunion stable time (seconds)
        <input
          type="number"
          min="0"
          max="30"
          value={config.reunionStableSeconds}
          onChange={(event) => update({ reunionStableSeconds: Number(event.target.value) })}
        />
      </label>
    </details>
    {error && <p className="range-validation" role="alert">{error}</p>}
    <Button variant="secondary" onClick={reset}><RotateCcw/>Reset recommended defaults</Button>
  </div>;
}
