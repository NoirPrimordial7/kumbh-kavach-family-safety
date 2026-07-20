import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { HoldSOS } from '@/components/HoldSOS';
import { EmergencyOverlay } from '@/features/alerts/EmergencyOverlay';
import { WelcomePage } from '@/features/family/WelcomePage';
import { SimulationPage } from '@/features/simulation/SimulationPage';
import { useAppStore, type Page } from '@/stores/useAppStore';

const pageByPath: Record<string, Page> = { '/': 'home', '/map': 'map', '/family': 'family', '/alerts': 'alerts', '/settings': 'settings' };

function FamilyApplication() {
  const opening = useAppStore((state) => state.opening);
  const session = useAppStore((state) => state.session);
  const location = useLocation();
  useEffect(() => { const page = pageByPath[location.pathname]; if (page) useAppStore.getState().setPage(page); }, [location.pathname]);
  return opening || !session ? <WelcomePage/> : <><AppShell/><HoldSOS/><EmergencyOverlay/></>;
}

export default function App() {
  return <BrowserRouter><Routes><Route path="/join" element={<FamilyApplication/>}/>{Object.keys(pageByPath).map((path) => <Route key={path} path={path} element={<FamilyApplication/>}/>) }<Route path="/simulation" element={<SimulationPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></BrowserRouter>;
}
