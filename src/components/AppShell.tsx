import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Bluetooth, ChevronRight, Home, Map, Radio, Settings, ShieldCheck, TriangleAlert, UserRound, Users, Wifi, WifiOff } from 'lucide-react';
import { BrandMark } from '@/features/family/WelcomePage';
import { useAppStore, type Page } from '@/stores/useAppStore';
import { HomePage } from '@/features/family/HomePage';
import { FamilyPage } from '@/features/family/FamilyPage';
import { AlertsPage } from '@/features/alerts/AlertsPage';
import { SettingsPage } from '@/features/family/SettingsPage';
import { DemoDock } from '@/features/presentation/DemoDock';
import { useNavigate } from 'react-router-dom';

const navigation: { id: Page; label: string; icon: typeof Home }[] = [
  { id:'home', label:'Home', icon:Home }, { id:'map', label:'Map', icon:Map }, { id:'family', label:'Family', icon:Users },
  { id:'alerts', label:'Alerts', icon:Bell }, { id:'settings', label:'Settings', icon:Settings }
];
const LiveMapPage = lazy(() => import('@/features/map/LiveMapPage').then((module) => ({ default: module.LiveMapPage })));

export function AppShell() {
  const navigate = useNavigate();
  const page = useAppStore(s=>s.page); const session = useAppStore(s=>s.session); const setPage = useAppStore(s=>s.setPage);
  const alerts = useAppStore(s=>s.alerts.filter(a=>!a.resolved).length); const members = useAppStore(s=>s.members); const presentationMode = useAppStore(s=>s.presentationMode);
  const [online,setOnline] = useState(navigator.onLine);
  useEffect(()=>{ const update=()=>setOnline(navigator.onLine); addEventListener('online',update);addEventListener('offline',update);return()=>{removeEventListener('online',update);removeEventListener('offline',update)}},[]);
  if (!session) return null;
  return <div className={`app-shell ${presentationMode?'is-presentation':''}`}>
    <div className="paper-grain fixed-grain"/>
    <aside className="sidebar"><BrandMark/><nav aria-label="Primary navigation">{navigation.map(item=><button key={item.id} className={page===item.id?'active':''} onClick={()=>{setPage(item.id);navigate(item.id==='home'?'/':`/${item.id}`)}} aria-current={page===item.id?'page':undefined}><item.icon/><span>{item.label}</span>{item.id==='alerts'&&alerts>0&&<i>{alerts}</i>}</button>)}</nav><div className="sidebar-network"><span className="status-light"/><div><small>PRIVATE SESSION</small><strong>{online?'Family network live':'Offline · cached'}</strong></div>{online?<Wifi/>:<WifiOff/>}</div><button className="simulation-side" onClick={()=>navigate('/simulation')}><Radio/><span>Simulation Lab<small>Research layer</small></span><ChevronRight/></button></aside>
    <header className="mobile-header"><BrandMark compact/><div><span className="status-light"/><strong>{session.name}</strong></div><ShieldCheck/></header>
    <main className="app-main">
      <div className="topline"><div><span className="tracking-pill"><i/> TRACKING ACTIVE</span><span>{session.name}</span><span className="top-event">{session.eventName}</span></div><div><span>{members.length} members</span><span>{online?<Wifi/>:<WifiOff/>}{online?'Online':'Offline'}</span><span><Bluetooth/>Optional BLE</span></div></div>
      <AnimatePresence mode="wait"><motion.div key={page} className="page-motion" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.24}}>{page==='home'&&<HomePage/>}{page==='map'&&<Suspense fallback={<div className="page map-loading">Preparing the private map…</div>}><LiveMapPage/></Suspense>}{page==='family'&&<FamilyPage/>}{page==='alerts'&&<AlertsPage/>}{page==='settings'&&<SettingsPage/>}</motion.div></AnimatePresence>
    </main>
    <nav className="bottom-nav" aria-label="Mobile navigation">{navigation.map(item=><button key={item.id} className={page===item.id?'active':''} onClick={()=>{setPage(item.id);navigate(item.id==='home'?'/':`/${item.id}`)}}><item.icon/><span>{item.label}</span>{item.id==='alerts'&&alerts>0&&<i>{alerts}</i>}</button>)}</nav>
    <DemoDock/>
  </div>;
}

export function PageHeading({ eyebrow, title, copy, action }: { eyebrow:string;title:string;copy?:string;action?:React.ReactNode }) { return <header className="page-heading"><div><p className="eyebrow"><span/>{eyebrow}</p><h1>{title}</h1>{copy&&<p>{copy}</p>}</div>{action}</header>; }

export function StatusBadge({ status }: { status:string }) { return <span className={`status-badge status-${status}`}><i/>{status}</span>; }

export function Avatar({ name, tone='violet' }: { name:string;tone?:string }) { return <span className={`member-avatar tone-${tone}`}>{name.split(' ').map(n=>n[0]).join('').slice(0,2)}<i/></span>; }

export function NetworkStrip() { return <div className="network-strip"><div><Radio/><span><small>FAMILY NETWORK</small><strong>Private device circle</strong></span></div><div><span><Bluetooth/> Band link</span><span><Wifi/> Phone sync</span><span><UserRound/> 4 members</span></div><TriangleAlert className="sr-only"/></div>; }
