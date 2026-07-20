# Future native application plan

The web app keeps device and location behavior behind ports so a native client can replace adapters without replacing React product concepts or domain rules.

An Android-first native app would add Google Nearby Connections for offline phone-to-phone exchange, encrypted local peer identity, foreground-service location during an explicit event session, background BLE reliability, native notifications, and queued cloud reconciliation. iOS requires a separate Multipeer Connectivity/Core Bluetooth strategy and stricter background execution design.

Recommended phases:

1. Stabilize the family/session/alert protocol and threat model.
2. Build native location and Nearby adapters against the existing domain contracts.
3. Add end-to-end encryption with rotating session keys and explicit join approval.
4. Add background/low-power behavior, device recovery, and offline conflict handling.
5. Validate on event grounds before any public-safety claim.

The native app should never expose a public family directory or organizer-facing location feed by default.
