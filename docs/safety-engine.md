# Safety engine

All state derivation lives under `src/domain/safety`. UI components and simulations supply observations; they do not assign statuses directly.

Default configuration:

| Value | Default | Valid range |
| --- | ---: | ---: |
| Safe radius | 50 m | 5–1000 m |
| Warning ratio | 0.8 | 0.5–0.95 |
| Separation grace | 5 s | 0–60 s |
| Stale timeout | 30 s | 5–600 s |
| Reunion radius | 15 m | 3–250 m |
| GPS accuracy buffer | 8 m | 0–100 m |
| Reunion stable duration | 3 s | 0–30 s |

Distance uses Haversine metres. Effective separation distance subtracts at most the configured accuracy buffer from the measured distance; the strategy avoids treating an unbounded accuracy estimate as proof of safety.

Priority is SOS, stale/offline, confirmed stable reunion, separated after grace, warning, then safe. Reunion additionally requires prior danger eligibility, an active flow, range, stable duration, and guardian confirmation. SOS always wins.

Exactly at the warning threshold is warning. Exactly at the safe radius is not separated. Boundary timestamps prevent immediate separation outside the radius. Configuration is Zod-validated and migrated from the legacy millisecond shape; corrupt persisted configuration falls back to recommended defaults.
