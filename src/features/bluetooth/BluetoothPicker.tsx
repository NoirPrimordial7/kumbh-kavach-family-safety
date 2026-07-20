import { useState } from 'react';
import { Bluetooth, BluetoothOff, Radio, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MockBluetoothAdapter, WebBluetoothAdapter } from '@/services/bluetoothAdapter';
import { useAppStore } from '@/stores/useAppStore';

export function BluetoothPicker() {
  const [state,setState]=useState<'idle'|'scanning'|'connected'|'unsupported'|'cancelled'|'error'>('idle'); const [name,setName]=useState('');
  async function scan(){setState('scanning');try{const band=await new WebBluetoothAdapter().scan();if(band){setName(band.name);setState('connected');useAppStore.getState().setBluetoothConnected(true);useAppStore.getState().addActivity(`${band.name} connected through Web Bluetooth`,'device')}}catch(error){const message=error instanceof Error?error.message:'';setState(message.includes('unavailable')?'unsupported':message.includes('cancel')?'cancelled':'error')}}
  async function demo(){const band=await new MockBluetoothAdapter().scan();if(band){useAppStore.getState().addSimulatedBand();setName(band.name);setState('connected')}}
  return <div className="bluetooth-picker"><span className={`bluetooth-icon ${state==='connected'?'connected':''}`}>{state==='unsupported'?<BluetoothOff/>:<Bluetooth/>}</span><div><h3>{state==='connected'?name:'Connect a Smart Mauli Band'}</h3><p>{state==='idle'&&'Chrome can connect to one nearby BLE band. Scanning only starts when you press the button.'}{state==='scanning'&&'Looking for KAVACH-BAND devices nearby…'}{state==='unsupported'&&'Web Bluetooth is unavailable here. The full demonstration still works with a clearly labelled simulated band.'}{state==='cancelled'&&'Band selection was cancelled. Nothing was connected.'}{state==='error'&&'The band could not be connected. Check Bluetooth permissions and try again.'}{state==='connected'&&'Connected for this browser session. Direct BLE, not a Bluetooth Mesh network.'}</p><div><Button onClick={scan} disabled={state==='scanning'}>{state==='scanning'?<RefreshCcw className="spin"/>:<Bluetooth/>}{state==='scanning'?'Scanning…':'Scan for real band'}</Button><Button variant="secondary" onClick={demo}><Radio/>Add demo band</Button></div></div></div>;
}
