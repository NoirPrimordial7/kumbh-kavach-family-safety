export function signalEmergency() {
  if ('vibrate' in navigator) navigator.vibrate?.([180, 100, 180]);
}
