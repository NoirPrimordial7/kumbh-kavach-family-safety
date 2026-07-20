export interface NativeLocationSyncPort { publish(position: GeolocationPosition): Promise<void>; subscribe(callback: PositionCallback): () => void }
export const browserLocationSync: NativeLocationSyncPort = { async publish() { return; }, subscribe() { return () => undefined; } };
