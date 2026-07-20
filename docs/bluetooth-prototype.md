# Smart Mauli Web Bluetooth prototype

This is a direct BLE peripheral connection, not a phone-to-phone Bluetooth Mesh.

## Advertising and GATT

- Device name prefix: `KAVACH-BAND`
- Custom service: `f0a00001-0451-4000-b000-000000000001`
- Heartbeat characteristic (notify): `f0a00002-0451-4000-b000-000000000001`
- Status characteristic (read/notify): `f0a00003-0451-4000-b000-000000000001`
- SOS characteristic (notify): `f0a00004-0451-4000-b000-000000000001`
- Location characteristic (read/notify): `f0a00005-0451-4000-b000-000000000001`
- Command/device information characteristic (write/read): `f0a00006-0451-4000-b000-000000000001`
- Battery: standard Battery Service `0x180F`, Battery Level `0x2A19`

Suggested payloads are compact UTF-8 JSON for the prototype: heartbeat `{ "seq": 24, "uptime": 812 }`; status `{ "worn": true, "signal": 82 }`; SOS `{ "active": true, "at": 1721460000 }`; location `{ "lat": 22.6184, "lng": 75.7741, "accuracy": 8 }`. Commands use one byte: `0x01` acknowledge and `0x02` locate/vibrate.

An ESP32 should advertise the custom service and name prefix, encrypt bonded sessions where supported, reject writes outside the command format, rate-limit SOS, and persist no family identity beyond pairing. Change UUIDs in the centralized config before firmware production.

Web Bluetooth requires a user gesture and normally HTTPS/localhost. Support varies by browser and operating system. The mock adapter implements the same interface and is visually identified as simulated.
