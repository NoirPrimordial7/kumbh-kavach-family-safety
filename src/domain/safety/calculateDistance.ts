import type { LocationSample } from '@/types/safety';

const EARTH_RADIUS_METRES = 6_371_008.8;
const radians = (degrees: number) => degrees * Math.PI / 180;

export function calculateDistanceMeters(
  a: Pick<LocationSample, 'lat' | 'lng'>,
  b: Pick<LocationSample, 'lat' | 'lng'>,
): number {
  const latDelta = radians(b.lat - a.lat);
  const lngDelta = radians(b.lng - a.lng);
  const aLat = radians(a.lat);
  const bLat = radians(b.lat);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(aLat) * Math.cos(bLat) * Math.sin(lngDelta / 2) ** 2;
  return EARTH_RADIUS_METRES * 2
    * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function offsetCoordinate(
  origin: Pick<LocationSample, 'lat' | 'lng'>,
  eastMeters: number,
  northMeters: number,
): Pick<LocationSample, 'lat' | 'lng'> {
  return {
    lat: origin.lat + northMeters / 111_195,
    lng: origin.lng + eastMeters / (111_195 * Math.cos(origin.lat * Math.PI / 180)),
  };
}
