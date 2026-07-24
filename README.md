# Kumbh Kavach Family Safety

Kumbh Kavach is an installable React family-safety demonstration for crowded places. A guardian creates a private family, relatives join by six-digit code, QR code, or invite link, and the app presents phone and Smart Mauli Band locations, separation alerts, SOS, and guided reunion. The original dark crowd Command Center remains isolated at `/simulation`.

The UI uses React, Vite, TypeScript, Tailwind CSS, Motion, Zustand, MapLibre, and PMTiles. It has no Electron dependency, so the same interface can later be wrapped without a rewrite.

## Capability labels

- **REAL NOW:** responsive PWA, browser-local family/demo state, opt-in geolocation, same-origin regional map, optional Firebase, and experimental direct Web Bluetooth in supported Chromium browsers.
- **SIMULATED NOW:** extra phones and bands, deterministic movement, battery/connection changes, separation, SOS, and reunion.
- **FUTURE NATIVE:** disconnected phone-to-phone exchange using an Android implementation such as Nearby Connections.

A browser does not provide a reliable offline Bluetooth mesh between phones. Firestore can cache previously loaded data, but does not create live disconnected peer synchronization.

## Local development

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Demo Mode needs no Firebase credentials, Bluetooth hardware, or location permission. Select **Start Jury Demo** on the welcome screen.

Quality commands:

```bash
npm run verify:maps
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run check
```

## Map data

Production uses the bounded, same-origin archive at:

```text
public/maps/nashik-ramkund-v1.pmtiles
```

The runtime URL is `/maps/nashik-ramkund-v1.pmtiles`; it never depends on the invalid 20260518 daily-build URL. `npm run verify:maps` rejects a missing, tiny, HTML, or non-v3 file. The application tries the regional archive, optional online backups, an installed OPFS copy, then the intentional coordinate fallback.

To regenerate the verified Ramkund extract with the official PMTiles CLI:

```bash
pmtiles extract https://build.protomaps.com/YYYYMMDD.pmtiles public/maps/nashik-ramkund-v1.pmtiles --bbox=73.788,19.999,73.8005,20.012
```

Replace `YYYYMMDD` with an available official daily build. Verify the source and bounding box before committing. Do not use a global archive. See [map-and-pmtiles.md](docs/map-and-pmtiles.md).

If the detailed map fails, markers, status circles, reunion geometry, fit-family, coordinates, and simulation remain available on the bundled fallback. A single Retry Map action restarts the finite source chain.

## Firebase and privacy

Copy `.env.example` to `.env.local` only when configuring Firebase. Incomplete or absent variables select local Demo Mode without initializing Firebase. Enable Anonymous Authentication and review `firebase.rules` before using Firestore. Locations are family-scoped and must never be publicly queryable.

Browser location and Bluetooth permissions are requested only after explicit user actions. No credential or Firebase service-account secret belongs in client environment variables.

## Offline behavior

After one online load, the service worker caches the shell. Demo data and safety settings persist in local storage. To avoid corrupt partial-range caching, the service worker passes PMTiles ranges through; Settings can deliberately install the complete bounded archive into Origin Private File System. First-load offline use is not guaranteed; Firebase does not synchronize two disconnected phones; Web Bluetooth support varies.

## Deploy on Vercel

Import the repository with the Vite preset:

- Build command: `npm run build`
- Output: `dist`
- Node: 20 or newer
- Firebase variables: optional

`vercel.json` protects `/maps/*` from SPA rewrites, advertises byte ranges, sets immutable map caching, and explicitly rewrites application routes. Validate a deployment with a normal request and a `Range: bytes=0-7` request to the PMTiles URL.

## Troubleshooting

- **Map verification failed:** regenerate the regional archive with the official tool and verified bounds.
- **Detailed basemap unavailable:** use the intentional fallback, then Retry Map once network access returns.
- **Old behavior after deployment:** update the service worker or use Settings → Clear app caches.
- **`[BHK] ... publicKey or merchantId`:** no BHK/widget SDK exists in this repository; this is browser-extension or injected third-party console output. Test in a clean profile.
- **Bluetooth unavailable/denied:** continue with simulated bands; no core demo flow depends on hardware.

Technical details live under [docs](docs/architecture.md), including the safety engine, deterministic simulation, Firebase model, offline boundaries, testing, and future native direction.
