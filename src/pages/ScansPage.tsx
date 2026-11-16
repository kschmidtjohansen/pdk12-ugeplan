import React, { useEffect, useRef, useState } from 'react';
import { Rotate3d } from 'lucide-react';
import { useScanAccessState, SCANS_URL } from '@/hooks/useScanAccess';
import { useLocation } from 'react-router-dom';
import { useDepartment } from '@/context/DepartmentContext';
import { canOpenScanSettings, scanDepartmentOptions, scanSectionFromSearch } from '@/lib/scansNavigation';
import { useAuth } from '@/context/AuthContext';
import { useSharedDutyDepartments } from '@/hooks/duty/useSharedDutyDepartments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * 3D-scanninger as a part of PolyPlan: PolyPlan's menu, top bar, login and light/dark stay around it, and the
 * tour app (public/3d) runs in a frame from the same site. The frame reports the open tour (#t-...), so the
 * address can be bookmarked; links shared with insurers keep using the public page.
 */
const ScansPage: React.FC<{ adminSettings?: boolean }> = ({ adminSettings = false }) => {
  const access = useScanAccessState();
  const frame = useRef<HTMLIFrameElement>(null);
  const location = useLocation();
  const { selectedDepartment, selectedDepartmentId, departments } = useDepartment();
  const { user } = useAuth();
  const { sharedDepartmentIds, loading: sharedLoading } = useSharedDutyDepartments();
  const options = scanDepartmentOptions(departments, selectedDepartmentId, sharedDepartmentIds, user?.role);
  const [localDepartment, setLocalDepartment] = useState<{ base: string | null; id: string | null }>({ base: selectedDepartmentId, id: selectedDepartmentId });
  const chosenId = localDepartment.base === selectedDepartmentId && options.some(d => d.id === localDepartment.id) ? localDepartment.id : selectedDepartmentId;
  const chosenDepartment = options.find(d => d.id === chosenId) ?? selectedDepartment;
  const requestedSection = scanSectionFromSearch(location.search);
  const section = adminSettings ? 'settings' : requestedSection === 'settings' ? 'tours' : requestedSection;
  const sendNavigation = () => frame.current?.contentWindow?.postMessage({ type: 'p360:navigate', section, adminSettings, department: chosenDepartment ? { id: chosenDepartment.id, name: chosenDepartment.name } : null }, window.location.origin);
  const navigationRef = useRef(sendNavigation);
  navigationRef.current = sendNavigation;
  useEffect(() => { navigationRef.current(); }, [section, chosenDepartment, adminSettings, location.key]);
  // the address at the time the page opened decides which tour the frame starts on
  const [src] = useState(() => `${SCANS_URL}?embed=1${adminSettings ? '&admin=1' : window.location.hash}`);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: unknown; hash?: unknown } | null;
      if (d?.type === 'p360:ready') { navigationRef.current(); return; }
      if (!d || d.type !== 'p360:hash' || typeof d.hash !== 'string' || !/^(#[\w-]*)?$/.test(d.hash)) return;
      if (d.hash !== window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + d.hash);
    };
    // back/forward or an edited address: tell the frame which tour to show
    const onHash = () => frame.current?.contentWindow?.postMessage({ type: 'p360:go', hash: window.location.hash }, window.location.origin);
    window.addEventListener('message', onMessage);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('message', onMessage); window.removeEventListener('hashchange', onHash); };
  }, []);

  if (access === 'loading') {
    return <div className="mx-4 h-[calc(100dvh-8rem)] animate-pulse rounded-lg border border-border bg-muted/40" aria-label="Indlæser 3D-scanninger" />;
  }
  if (access === 'denied' || (adminSettings && !canOpenScanSettings(user?.role))) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-xs">
        <Rotate3d className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold">Du har ikke adgang til 3D-scanninger</h1>
        <p className="mt-1 text-sm text-muted-foreground">Din rolle giver ikke adgang. Spørg en administrator.</p>
      </div>
    );
  }
  return (
    // flush with PolyPlan's top bar and menu; the frame fills the rest of the screen
    <div className={adminSettings ? 'h-[calc(100dvh-16rem)] min-h-[480px]' : '-mt-4 -mb-[calc(72px+env(safe-area-inset-bottom))] lg:-mb-4 h-[calc(100dvh-4rem-72px-env(safe-area-inset-bottom))] lg:h-[calc(100dvh-4rem)] flex flex-col'}>
      {!adminSettings && <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2">
        <span className="text-sm font-medium" id="scan-department-label">Afdeling</span>
        <Select value={chosenId ?? undefined} onValueChange={id => setLocalDepartment({ base: selectedDepartmentId, id })} disabled={!selectedDepartmentId || (sharedLoading && user?.role !== 'super_admin')}>
          <SelectTrigger aria-labelledby="scan-department-label" className="min-h-11 w-full max-w-sm"><SelectValue placeholder="Vælg afdeling" /></SelectTrigger>
          <SelectContent>{options.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>}
      <iframe
        ref={frame}
        src={src}
        onLoad={() => navigationRef.current()}
        title={adminSettings ? '3D-indstillinger' : '3D-scanninger'}
        className="block h-full min-h-0 w-full flex-1 border-0 bg-background"
        allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
      />
    </div>
  );
};

export default ScansPage;
