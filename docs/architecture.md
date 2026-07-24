# Architecture

## Layers

- `src/config`: centralized brand, color, BLE, map, environment, and session configuration.
- `src/domain/safety`: pure validated configuration, Haversine distance, boundary timing, member derivation, and family derivation.
- `src/types`: family, member, device, position, alert, session, and connection contracts.
- `src/services`: separation engine, family invites, device labels, Web Bluetooth/mock adapters, geolocation, Firebase/local storage, alert behavior, and native-sync port.
- `src/stores`: Zustand session and deterministic jury-story state.
- `src/features`: family onboarding/hub, MapLibre/offline map, Bluetooth, alerts, presentation, settings, and simulation.
- `src/components/ui`: owned shadcn-style primitives. `src/components`: cross-feature application shell and emergency controls.

The default data path is local and deterministic. Firebase is an optional adapter selected only when environment variables exist. The map page is lazy-loaded so MapLibre does not inflate the first-view bundle. The React surface has no Electron imports and can be hosted statically or embedded in a later secure native shell.

## Family safety state

The shared engine accepts raw coordinates, heartbeat, sharing, SOS, validated configuration, and reunion context. It returns `safe`, `warning`, `separated`, `offline`, `sos`, or `reunited` plus measured/effective/reunion distances. UI, alerts, map geometry, and simulation consume that result.

Map source selection, PMTiles protocol lifetime, and offline archive installation are separate services. The fallback is a finite final source rather than a retry loop. Persisted Zustand state is versioned and migrates legacy safety settings.

## Security boundaries

Family location is never globally queried. A future Firebase deployment must require authentication and membership on every family-scoped read/write. Invites should be redeemed server-side so clients cannot grant themselves arbitrary membership. Event sessions expire and users can pause or end sharing.
