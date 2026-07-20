/// <reference types="vite/client" />

interface BluetoothRemoteGATTCharacteristic {
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}
interface BluetoothRemoteGATTService { getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic> }
interface BluetoothRemoteGATTServer { connected: boolean; connect(): Promise<BluetoothRemoteGATTServer>; disconnect(): void; getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService> }
interface BluetoothDevice { id: string; name?: string; gatt?: BluetoothRemoteGATTServer }
interface BluetoothRequestDeviceOptions { filters?: Array<{ namePrefix?: string }>; optionalServices?: string[] }
interface Bluetooth { requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice> }
interface Navigator { bluetooth?: Bluetooth }
