# Testing

```bash
npm ci
npm run verify:maps
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run test:rules
npm run build
npm run test:e2e
npm audit
```

Vitest covers distance, boundaries, priority, validation/migration, store transitions, component controls, map-source order, and deterministic scaling. Playwright uses a clean Chrome profile and fails on unexpected console or page errors while exercising Demo Mode, routes, PMTiles, fallback, settings persistence, SOS/reunion, offline behavior, Simulation Lab, and viewport overflow.

The map verifier is mandatory in CI and before production builds. GitHub Actions uses Node 20, `npm ci`, the full check pipeline, installs Playwright Chrome, and runs smoke tests without Firebase credentials.

The repository contains no `BHK`, `widget_sdk`, `publicKey`, or `merchantId` integration. Such console output originates outside the tested application.
