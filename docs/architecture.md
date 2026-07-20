# Architecture

## Layers

- `src/config`: centralized brand, color, BLE, map, session, and threshold configuration.
- `src/types`: family, member, device, position, alert, session, and connection contracts.
- `src/services`: separation engine, family invites, device labels, Web Bluetooth/mock adapters, geolocation, Firebase/local storage, alert behavior, and native-sync port.
- `src/stores`: Zustand session and deterministic jury-story state.
- `src/features`: family onboarding/hub, MapLibre/offline map, Bluetooth, alerts, presentation, settings, and simulation.
- `src/components/ui`: owned shadcn-style primitives. `src/components`: cross-feature application shell and emergency controls.

The default data path is local and deterministic. Firebase is an optional adapter selected only when environment variables exist. The map page is lazy-loaded so MapLibre does not inflate the first-view bundle. The React surface has no Electron imports and can be hosted statically or embedded in a later secure native shell.

## Separation state

The shared engine accepts guardian/member coordinates, heartbeat age, radius, warning multiplier, stale timeout, SOS state, and reunion radius. It returns `safe`, `warning`, `separated`, `offline`, `sos`, or `reunited` plus Haversine distance. UI demo steps write the same domain states real adapters will eventually produce.

## Security boundaries

Family location is never globally queried. A future Firebase deployment must require authentication and membership on every family-scoped read/write. Invites should be redeemed server-side so clients cannot grant themselves arbitrary membership. Event sessions expire and users can pause or end sharing.
