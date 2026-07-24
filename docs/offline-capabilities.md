# Offline capabilities

## Works after a successful initial load

- PWA shell and family routes
- persisted demo/family state and safety configuration
- deterministic device simulation, SOS, alerts, and reunion
- bundled coordinate fallback
- cached or explicitly installed bounded Ramkund PMTiles, when available
- legacy Simulation Lab asset

## Does not work offline

- first-time installation
- fresh remote map backups
- live Firestore exchange between disconnected phones
- a browser-based phone-to-phone Bluetooth mesh

The service worker excludes `/maps/*` from navigation fallback and passes PMTiles byte ranges directly to the network. It does not cache partial `206` responses as if they were complete archives. Settings deliberately installs the complete bounded archive into OPFS for offline use and can clear application caches. Failed Firebase, location, Bluetooth, or map requests degrade to local/simulated behavior without unhandled errors.
