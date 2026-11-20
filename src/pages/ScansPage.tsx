import React, { useEffect, useRef, useState } from 'react';
import { Rotate3d } from 'lucide-react';
import { useScanAccessState, SCANS_URL } from '@/hooks/useScanAccess';
import { useLocation } from 'react-router-dom';
import { useDepartment } from '@/context/DepartmentContext';
import { canOpenScanSettings, scanDepartmentOptions, scanSectionFromSearch } from '@/lib/scansNavigation';
import { useAuth } from '@/context/AuthContext';
import { useSharedDutyDepartments } from '@/hooks/duty/useSharedDutyDepartments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/Layout/PageHeader';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import embedCss from '@/styles/scans-embed.css?raw';

/** Lærredets Facet-udtryk for 3D-appen i rammen: et ark, PolyPlan sætter ind i det samme-origin dokument. */
const styleFrame = (frame: HTMLIFrameElement | null) => {
  try {
    const doc = frame?.contentDocument;
    if (!doc?.head || doc.getElementById('pp-facet-embed')) return;
    const el = doc.createElement('style'); el.id = 'pp-facet-embed'; el.textContent = embedCss; doc.head.appendChild(el);
  } catch { /* a frame that is not same-origin keeps its own look */ }
};

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

  const sharedNames = options.filter(d => d.id !== selectedDepartmentId && sharedDepartmentIds.includes(d.id)).map(d => d.name);
  const eyebrow = [selectedDepartment?.name, ...sharedNames].filter(Boolean).join(' og ');

  if (access === 'loading') {
    return <div className="mx-4 h-[calc(100dvh-8rem)] animate-pulse rounded-lg border border-border bg-muted/40" aria-label="Indlæser 3D-scanninger" />;
  }
  if (access === 'denied' || (adminSettings && !canOpenScanSettings(user?.role))) {
    return (
      <div className="facet-card mx-auto mt-16 max-w-md p-6 text-center">
        <Rotate3d className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold">Du har ikke adgang til 3D-scanninger</h1>
        <p className="mt-1 text-sm text-muted-foreground">Din rolle giver ikke adgang. Spørg en administrator.</p>
      </div>
    );
  }
  return (
    // flush with PolyPlan's top bar and menu; the frame fills the rest of the screen
    <div className={adminSettings ? 'h-[calc(100dvh-16rem)] min-h-[480px]' : '-mt-4 -mb-[calc(72px+env(safe-area-inset-bottom))] lg:-mb-4 h-[calc(100dvh-4rem-72px-env(safe-area-inset-bottom))] lg:h-[calc(100dvh-4rem)] flex flex-col'}>
      {!adminSettings && <div className="shrink-0 px-3 pt-4 sm:px-6 lg:px-8 xl:px-12">
        <PageHeader title="3D-scanninger" eyebrow={eyebrow}
          description={options.length > 1 ? 'Rundvisninger fra din afdeling og de afdelinger, I deler vagt med' : 'Rundvisninger fra din afdeling'} />
        <div className="facet-card flex flex-wrap items-center gap-2 px-4 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground" id="scan-department-label">Afdelinger</span>
          {options.length <= 6 ? (
            <div role="radiogroup" aria-labelledby="scan-department-label" className="flex flex-wrap gap-1.5">
              {options.map(d => {
                const on = d.id === chosenId, shared = d.id !== selectedDepartmentId && sharedDepartmentIds.includes(d.id);
                return (
                  <button key={d.id} type="button" role="radio" aria-checked={on} disabled={!selectedDepartmentId || (sharedLoading && user?.role !== 'super_admin')}
                    onClick={() => setLocalDepartment({ base: selectedDepartmentId, id: d.id })}
                    className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors',
                      on ? (shared ? 'bg-[hsl(var(--shared))] text-primary-foreground' : 'bg-primary text-primary-foreground') : shared ? 'facet-shared-chip' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                    {on && <Check aria-hidden className="h-3.5 w-3.5" />}{d.name}{shared && <span className="font-medium opacity-80">· delt vagt</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <Select value={chosenId ?? undefined} onValueChange={id => setLocalDepartment({ base: selectedDepartmentId, id })} disabled={!selectedDepartmentId || (sharedLoading && user?.role !== 'super_admin')}>
              <SelectTrigger aria-labelledby="scan-department-label" className="min-h-9 w-full max-w-xs rounded-full"><SelectValue placeholder="Vælg afdeling" /></SelectTrigger>
              <SelectContent>{options.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <span className="text-[11px] text-muted-foreground sm:ml-2">Afdelinger, I deler vagt med, vises automatisk.{user?.role === 'super_admin' ? ' Som super admin kan du vælge alle afdelinger.' : ''}</span>
        </div>
      </div>}
      <iframe
        ref={frame}
        src={src}
        onLoad={() => { styleFrame(frame.current); navigationRef.current(); }}
        title={adminSettings ? '3D-indstillinger' : '3D-scanninger'}
        className="block h-full min-h-0 w-full flex-1 border-0 bg-background"
        allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
      />
    </div>
  );
};

export default ScansPage;
