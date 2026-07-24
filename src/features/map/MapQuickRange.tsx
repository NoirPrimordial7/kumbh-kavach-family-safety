import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { warningThresholdMeters } from '@/domain/safety/safetyConfig';
import { useAppStore } from '@/stores/useAppStore';

export function MapQuickRange() {
  const config = useAppStore((state) => state.safetyConfig);
  const update = useAppStore((state) => state.updateSafety);
  const reset = useAppStore((state) => state.resetSafety);

  return <details className="map-quick-range">
    <summary><SlidersHorizontal/>Safety ranges</summary>
    <div>
      <fieldset>
        <legend>Safe radius</legend>
        <div className="quick-presets">{[20, 50, 100].map((radius) =>
          <button
            type="button"
            key={radius}
            className={config.safeRadiusMeters === radius ? 'active' : ''}
            onClick={() => update({ safeRadiusMeters: radius })}
          >{radius}m</button>)}</div>
        <label htmlFor="map-safe-radius">Custom safe radius</label>
        <input
          id="map-safe-radius"
          type="range"
          min="5"
          max="250"
          value={config.safeRadiusMeters}
          onChange={(event) => update({ safeRadiusMeters: Number(event.target.value) })}
        />
        <output htmlFor="map-safe-radius">
          {config.safeRadiusMeters}m safe · {Math.round(warningThresholdMeters(config))}m warning
        </output>
      </fieldset>
      <fieldset>
        <legend>Reunion radius</legend>
        <label htmlFor="map-reunion-radius">Reunion radius in metres</label>
        <input
          id="map-reunion-radius"
          type="number"
          min="3"
          max="250"
          value={config.reunionRadiusMeters}
          onChange={(event) => update({ reunionRadiusMeters: Number(event.target.value) })}
        />
      </fieldset>
      <button type="button" className="quick-reset" onClick={reset}>
        <RotateCcw/>Recommended defaults
      </button>
    </div>
  </details>;
}
