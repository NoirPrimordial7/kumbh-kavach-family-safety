import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Bluetooth, MapPin, Radio, ShieldCheck, Smartphone, Users, X } from 'lucide-react';
import QRCode from 'qrcode';
import { brand } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';
import { useNavigate } from 'react-router-dom';

type Flow = 'none' | 'create' | 'join' | 'success';

export function WelcomePage() {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<Flow>(location.pathname === '/join' ? 'join' : 'none');
  const [qr, setQr] = useState('');
  const session = useAppStore((s) => s.session);
  const createSession = useAppStore((s) => s.createSession);
  const startDemo = useAppStore((s) => s.startDemo);

  function submitCreate(form: HTMLFormElement) {
    const data = new FormData(form);
    createSession({ name: String(data.get('familyName')), guardianName: String(data.get('guardianName')), eventName: String(data.get('eventName')), emergencyContact: String(data.get('contact')), safetyRadius: 50, durationHours: Number(data.get('duration')) });
    setFlow('success');
    setTimeout(() => { const current = useAppStore.getState().session; if (current) void QRCode.toDataURL(`${location.origin}/join?code=${current.joinCode.replaceAll(' ','')}`, { width: 240, margin: 1 }).then(setQr); }, 0);
  }

  function submitJoin(form: HTMLFormElement) {
    const data = new FormData(form); const code = String(data.get('code')).replace(/\D/g,'').slice(0,6);
    createSession({ name: 'Joined Family', guardianName: String(data.get('name')), eventName: 'Ramkund · Nashik', safetyRadius: 50, durationHours: 6 });
    useAppStore.getState().addActivity(`Joined private family with code ${code}`, 'family');
    useAppStore.getState().dismissOpening();
  }

  return <main className="welcome-shell">
    <motion.div className="opening-wipe" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: .9, ease: [0.76,0,0.24,1], delay: .1 }} />
    <div className="paper-grain" />
    <motion.div className="field field-violet" animate={{ rotate: [1,3,1], scale: [1,1.025,1] }} transition={{ duration: 9, repeat: Infinity }} />
    <motion.div className="field field-blue" animate={{ x: [0,-18,0], y: [0,-10,0] }} transition={{ duration: 8, repeat: Infinity }} />
    <div className="field field-orange" />
    <header className="welcome-header">
      <BrandMark />
      <button className="simulation-link" onClick={() => location.assign('/simulation')}><span>Research layer</span> Open Simulation Lab <ArrowRight size={16}/></button>
    </header>
    <section className="welcome-stage">
      <div className="welcome-copy">
        <p className="eyebrow"><span /> Private family network</p>
        <h1><span>Stay close</span><span>when the crowd</span><span>pulls you apart.</span></h1>
        <p className="welcome-support">A private, opt-in safety circle for the people you came with—designed for festivals, fairs, pilgrimages and every crowded day out.</p>
        <div className="welcome-actions">
          <Button size="lg" onClick={() => setFlow('create')}>Create a family <ArrowRight size={18}/></Button>
          <Button size="lg" variant="secondary" onClick={() => setFlow('join')}>Join with code</Button>
          <button className="demo-text-button" onClick={()=>{startDemo();navigate('/map')}}>Start jury demo <span>→</span></button>
        </div>
        <p className="privacy-note"><ShieldCheck size={16}/> Location stays inside your private family session. Sharing is always opt in.</p>
      </div>
      <NetworkArtwork />
    </section>
    <footer className="welcome-footer"><span>Works without hardware in demo mode</span><div><span><i className="dot safe"/> Private</span><span><i className="dot connected"/> Connected</span><span><i className="dot sos"/> SOS ready</span></div></footer>
    <AnimatePresence>{flow !== 'none' && <motion.div className="flow-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section className="flow-panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} aria-modal="true" role="dialog">
        <button className="flow-close" aria-label="Close" onClick={() => setFlow('none')}><X/></button>
        {flow === 'create' && <CreateForm onSubmit={submitCreate}/>} {flow === 'join' && <JoinForm onSubmit={submitJoin}/>} {flow === 'success' && session && <Success session={session} qr={qr}/>} 
      </motion.section>
    </motion.div>}</AnimatePresence>
  </main>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) { return <div className="brand-mark"><span>{brand.logo}</span>{!compact && <div><strong>{brand.applicationName}</strong><small>family safety network</small></div>}</div>; }

function CreateForm({ onSubmit }: { onSubmit(form: HTMLFormElement): void }) { return <div className="flow-content"><p className="eyebrow"><span/> Begin a private circle</p><h2>Create your family.</h2><p>Set up a temporary session for one event. You stay in control of who joins and when it ends.</p><form onSubmit={(e)=>{e.preventDefault();onSubmit(e.currentTarget)}}>
  <label>Family name<input name="familyName" required defaultValue="Kumbh Kavach Team" /></label><label>Guardian name<input name="guardianName" required defaultValue="Ashwin Gudur" /></label><label>Event name<input name="eventName" required defaultValue="Ramkund · Nashik" /></label><label>Emergency contact <span>optional</span><input name="contact" type="tel" placeholder="+91…" /></label><label>Tracking duration<select name="duration" defaultValue="6"><option value="2">2 hours</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24">Until manually ended</option></select></label><Button size="lg" type="submit">Create private family <ArrowRight size={18}/></Button>
  </form></div>; }

function JoinForm({ onSubmit }: { onSubmit(form: HTMLFormElement): void }) { return <div className="flow-content"><p className="eyebrow"><span/> Join your people</p><h2>Enter the family code.</h2><p>Ask your family guardian for the six-digit code or open their private invite link.</p><form onSubmit={(e)=>{e.preventDefault();onSubmit(e.currentTarget)}}><label>Six-digit code<input name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" placeholder="274 961" required /></label><label>Your name<input name="name" required placeholder="Member name" /></label><label>Relation<select><option>Family member</option><option>Parent</option><option>Child</option><option>Friend</option></select></label><label>Device<select><option>Use this phone</option><option>Connect Smart Mauli Band</option><option>Add demo device</option></select></label><Button size="lg" type="submit">Join family <ArrowRight size={18}/></Button><button type="button" className="qr-placeholder">▦ Scan QR <small>prototype placeholder</small></button></form></div>; }

function Success({ session, qr }: { session: NonNullable<ReturnType<typeof useAppStore.getState>['session']>; qr: string }) {
  const enterHub = () => { useAppStore.getState().setPage('home'); useAppStore.getState().dismissOpening(); };
  return <div className="flow-content success-content"><p className="eyebrow"><span/> Your circle is ready</p><h2>Invite your family.</h2><p>Share this one-time event code. Only people with your invite can enter the private family map.</p><div className="invite-card">{qr ? <img src={qr} alt="Family invite QR code"/> : <div className="qr-loading"/>}<div><small>FAMILY CODE</small><strong>{session.joinCode}</strong><span>{session.id}</span></div></div><div className="success-actions"><Button onClick={()=>navigator.clipboard?.writeText(session.joinCode)}>Copy code</Button><Button variant="secondary" onClick={()=>navigator.share?.({title:brand.applicationName,text:`Join ${session.name}: ${session.joinCode}`,url:`${location.origin}/join?code=${session.joinCode.replaceAll(' ','')}`})}>Share invite</Button></div><Button className="w-full" size="lg" variant="violet" onClick={enterHub}>Enter family hub <ArrowRight/></Button></div>;
}

function NetworkArtwork() { const nodes = [{x:52,y:17,label:'Ashwin',icon:<Smartphone/>},{x:20,y:49,label:'Himank',icon:<Radio/>},{x:79,y:46,label:'Aditya',icon:<Smartphone/>},{x:44,y:79,label:'Arya',icon:<Bluetooth/>}]; return <div className="network-art" aria-label="Illustration of connected team devices"><div className="network-orbit"/><div className="network-safe-ring"/><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M52 17 L20 49 L44 79 L79 46 Z"/><path d="M52 17 L44 79 M20 49 L79 46"/></svg>{nodes.map((node,i)=><motion.div key={node.label} className={`network-node node-${i}`} style={{left:`${node.x}%`,top:`${node.y}%`}} animate={{y:[0,-7,0]}} transition={{duration:3+i*.4,repeat:Infinity}}>{node.icon}<span>{node.label}</span>{i===3&&<i/>}</motion.div>)}<div className="map-pulse"><MapPin/><span>Reunion point</span></div><div className="network-label"><Users/><span>4 teammates</span><strong>All close</strong></div></div>; }
