export type LocationPermissionState = 'idle' | 'waiting' | 'allowed' | 'denied' | 'unavailable';
export function watchLocation(onPosition: PositionCallback, onState: (state: LocationPermissionState) => void) {
  if (!navigator.geolocation) { onState('unavailable'); return () => undefined; }
  onState('waiting');
  const id = navigator.geolocation.watchPosition((position) => { onState('allowed'); onPosition(position); }, (error) => onState(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable'), { enableHighAccuracy: true, maximumAge: 5000 });
  return () => navigator.geolocation.clearWatch(id);
}
