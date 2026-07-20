import { brand } from '../config/brand';

export interface BandSnapshot { name: string; battery: number; connected: boolean; lastHeartbeat: number }
export interface BluetoothAdapter {
  scan(): Promise<BandSnapshot | null>;
  disconnect(): Promise<void>;
  reconnect(): Promise<BandSnapshot | null>;
  readBattery(): Promise<number>;
  readDeviceInformation(): Promise<Record<string, string>>;
  subscribe(event: 'heartbeat' | 'sos' | 'status', callback: (value: string) => void): () => void;
  acknowledge(): Promise<void>;
  locate(): Promise<void>;
}

export class WebBluetoothAdapter implements BluetoothAdapter {
  private device?: BluetoothDevice;
  async scan() {
    if (!navigator.bluetooth) throw new Error('Web Bluetooth is unavailable on this system.');
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: brand.bandNamePrefix }],
      optionalServices: [brand.ble.serviceUuid, brand.ble.batteryServiceUuid]
    });
    await this.device.gatt?.connect();
    return { name: this.device.name ?? 'Smart Mauli Band', battery: await this.readBattery(), connected: true, lastHeartbeat: Date.now() };
  }
  async disconnect() { this.device?.gatt?.disconnect(); }
  async reconnect() { if (!this.device?.gatt) return null; await this.device.gatt.connect(); return { name: this.device.name ?? 'Smart Mauli Band', battery: await this.readBattery(), connected: true, lastHeartbeat: Date.now() }; }
  async readBattery() {
    if (!this.device?.gatt?.connected) return 0;
    try { const service = await this.device.gatt.getPrimaryService('battery_service'); const characteristic = await service.getCharacteristic('battery_level'); const value = await characteristic.readValue(); return value.getUint8(0); } catch { return 0; }
  }
  async readDeviceInformation() { return { name: this.device?.name ?? 'Unknown', id: this.device?.id ?? 'Unknown', protocol: brand.ble.serviceUuid }; }
  subscribe(_event: 'heartbeat' | 'sos' | 'status', _callback: (value: string) => void) { return () => undefined; }
  async acknowledge() { await this.writeCommand(1); }
  async locate() { await this.writeCommand(2); }
  private async writeCommand(command: number) { const service = await this.device?.gatt?.getPrimaryService(brand.ble.serviceUuid); const characteristic = await service?.getCharacteristic(brand.ble.commandUuid); await characteristic?.writeValue(new Uint8Array([command])); }
}

export class MockBluetoothAdapter implements BluetoothAdapter {
  private connected = false;
  async scan() { this.connected = true; return { name: `${brand.bandNamePrefix}-DEMO-03`, battery: 86, connected: true, lastHeartbeat: Date.now() }; }
  async disconnect() { this.connected = false; }
  async reconnect() { this.connected = true; return this.scan(); }
  async readBattery() { return 86; }
  async readDeviceInformation() { return { name: `${brand.bandNamePrefix}-DEMO-03`, firmware: 'demo-1.0', protocol: brand.ble.serviceUuid }; }
  subscribe(_event: 'heartbeat' | 'sos' | 'status', _callback: (value: string) => void) { return () => undefined; }
  async acknowledge() { return; }
  async locate() { return; }
}
