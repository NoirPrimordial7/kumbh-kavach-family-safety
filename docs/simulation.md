# Deterministic family simulation

The scenario in `src/features/simulation/simulationScenario.ts` uses seed `20260724` and positions expressed in metres. Each generated frame is derived from the current safety and reunion configuration:

- safe at a fraction of safe radius
- warning between warning and safe thresholds
- outside during grace
- separated after grace
- immediate simulated SOS
- reunion selection and approach
- inside reunion range for the configured stable duration

Changing a range regenerates the current step. The Demo Dock supports play/pause, step navigation, restart/reset, 0.5×–4× speed, fullscreen, member selection, movement, SOS, connection, heartbeat, battery, reunion, and seeded random movement. Manual simulation actions append readable activity events.

The crowd-scale legacy Simulation Lab at `/simulation` is separate and sandboxed in an iframe.
