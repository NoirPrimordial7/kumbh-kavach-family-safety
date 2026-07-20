# Firebase data model

Suggested top-level documents use opaque IDs and contain no publicly enumerable location data.

- `families/{familyId}`: guardian UID, display name, event, join-token hash, created/expiry times.
- `families/{familyId}/members/{uid}`: name, relation, role, consent, sharing state.
- `families/{familyId}/devices/{deviceId}`: member UID, kind, reality, connection, battery, last heartbeat.
- `families/{familyId}/locations/{memberId}`: latest coordinate, accuracy, timestamp; optional capped history subcollection.
- `families/{familyId}/alerts/{alertId}`: member UID, kind, location snapshot, created, acknowledged, resolved.
- `families/{familyId}/sessions/{sessionId}`: start, expiry, radius, thresholds, ended state.

Security rules must require authenticated membership for reads and writes and guardian role for destructive settings. Join codes should be exchanged for membership using trusted server logic; never store a usable plaintext public join code. Use TTL cleanup for expired sessions and location history. Persistent Firestore cache supports viewing prior synchronized data but does not make disconnected peers communicate.
