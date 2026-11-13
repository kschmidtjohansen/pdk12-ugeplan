import React, { useEffect, useRef, useState } from 'react';
import { Rotate3d } from 'lucide-react';
import { useScanAccessState, SCANS_URL } from '@/hooks/useScanAccess';

/**
 * 3D-scanninger as a part of PolyPlan: PolyPlan's menu, top bar, login and light/dark stay around it, and the
 * tour app (public/3d) runs in a frame from the same site. The frame reports the open tour (#t-...), so the
 * address can be bookmarked; links shared with insurers keep using the public page.
 */
const ScansPage: React.FC = () => {
  const access = useScanAccessState();
  const frame = useRef<HTMLIFrameElement>(null);
  // the address at the time the page opened decides which tour the frame starts on
  const [src] = useState(() => `${SCANS_URL}?embed=1${window.location.hash}`);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: unknown; hash?: unknown } | null;
      if (!d || d.type !== 'p360:hash' || typeof d.hash !== 'string' || !/^(#[\w-]*)?$/.test(d.hash)) return;
      if (d.hash !== window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname + d.hash);
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
  if (access === 'denied') {
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
    <div className="-mt-4 -mb-[calc(72px+env(safe-area-inset-bottom))] lg:-mb-4 h-[calc(100dvh-4rem-72px-env(safe-area-inset-bottom))] lg:h-[calc(100dvh-4rem)]">
      <iframe
        ref={frame}
        src={src}
        title="3D-scanninger"
        className="block h-full w-full border-0 bg-background"
        allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
      />
    </div>
  );
};

export default ScansPage;
