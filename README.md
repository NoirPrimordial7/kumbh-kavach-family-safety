# Kumbh Kavach Family Safety

A responsive, installable family safety demonstration for crowded events. The consumer app uses a warm editorial design system, while the original dark Command Center remains isolated and unchanged at `/simulation`.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## What works without configuration

- Create or join a temporary family with a family code and QR invite.
- Four-device Jury Demo Mode with deterministic movement, warning, separation, SOS, reunion, and alert deduplication.
- Real MapLibre map centered on Ramkund, Nashik, using a PMTiles vector archive and OSM-derived geography.
- A pure Family Safety Engine derives states from coordinates, heartbeats, SOS, sharing, and reunion state. UI actions never directly assign a safety status.
- Optional browser geolocation and experimental Web Bluetooth, both with explicit user interaction and honest simulated fallbacks.
- PWA shell, responsive mobile map sheet, deep routes, local demo storage, and the legacy Simulation Lab.

## Map data and offline installation

The online default is the versioned Protomaps daily planet archive in `src/config/mapConfig.ts`. Production deployments should set `VITE_PMTILES_URL` to a controlled archive URL.

For offline installation, create a bounded Ramkund extract with the PMTiles CLI:

```bash
pmtiles extract https://build.protomaps.com/20260518.pmtiles nashik-ramkund-v1.pmtiles --bbox=73.788,19.999,73.8005,20.012
```

Host that file with byte-range support and set `VITE_OFFLINE_PMTILES_URL`. The settings screen downloads it into Origin Private File System storage. When offline mode is selected, the map protocol reads the local `File` through PMTiles `FileSource`; if no archive is installed the UI says so and attempts the online source instead.

Map attribution: © OpenStreetMap contributors · Protomaps. Event overlay coordinates and bounds live in `src/config/mapConfig.ts`; app branding, colors, logo, names, and device UUIDs live in `src/config/brand.ts`.

## Firebase and privacy

With no Firebase environment variables the app uses browser-local demo storage. To prepare multi-phone synchronization, enable Firebase Anonymous Authentication and Cloud Firestore, copy `.env.example` to `.env.local`, and review `firebase.rules`. Family locations must never be publicly queryable.

Tracking is opt-in, temporary, pausable, and private to the family session. Browser geolocation is not requested until the user presses the location button. Web Bluetooth requires a supported Chromium browser, HTTPS or localhost, a user gesture, OS permission, and compatible hardware.

## Deploy on Vercel

Import the repository into Vercel with the Vite preset. Build command is `npm run build` and output directory is `dist`. `vercel.json` rewrites application routes to `index.html`, so `/map`, `/family`, `/alerts`, `/settings`, and `/simulation` survive direct loads.

## Architecture

- `src/services/familySafetyEngine.ts`: pure distance and status derivation
- `src/services/alertEngine.ts`: deterministic alert lifecycle and deduplication
- `src/services/offlineMapService.ts`: OPFS install/remove/source abstraction
- `src/stores/useAppStore.ts`: raw device observations and demo orchestration
- `src/features/map/LiveMapPage.tsx`: MapLibre, PMTiles, Turf geometry, reunion UI
- `public/legacy/kumbh-kavach-command-center.html`: preserved legacy simulation

The React UI has no Electron dependency and can later be wrapped without rewriting the interface.
