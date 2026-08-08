import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useScreenDisplayData } from '@/hooks/useScreenDisplayData';
import { ScreenDisplayHeader } from '@/components/ScreenDisplay/ScreenDisplayHeader';
import { ScreenDisplayContent } from '@/components/ScreenDisplay/ScreenDisplayContent';
import { ScreenDisplayErrorBoundary } from '@/components/ScreenDisplay/ScreenDisplayErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { useScreenDisplayAbsences } from '@/hooks/useScreenDisplayAbsences';

type SubDept = { id: string; name: string };

const ScreenDisplayPage: React.FC = () => {
  const getInitialDate = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (import.meta.env.DEV) {
      console.log('[ScreenDisplayPage] URL PARSING:', {
        fullUrl: window.location.href,
        dateParam,
        timestamp: new Date().toISOString()
      });
    }
    
    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam);
        if (import.meta.env.DEV) console.log('[ScreenDisplayPage] PARSED DATE:', format(parsedDate, 'yyyy-MM-dd'));
        return parsedDate;
      } catch (error) {
        if (import.meta.env.DEV) console.error('[ScreenDisplayPage] Error parsing date from URL:', dateParam, error);
      }
    }
    
    return new Date();
  };

  const getUrlParam = (name: string): string | null => {
    return new URLSearchParams(window.location.search).get(name);
  };

  const shouldShowAllAssignments = () => {
    return false;
  };

  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  const [showAllAssignments] = useState(shouldShowAllAssignments);
  const departmentId = getUrlParam('departmentId');
  const initialSubDepartmentId = getUrlParam('subDepartmentId');

  // Rotation params
  const rotateEnabled = getUrlParam('rotate') === 'true';
  const intervalSeconds = useMemo(() => {
    const raw = parseInt(getUrlParam('interval') || '', 10);
    if (!Number.isFinite(raw) || raw <= 0) return 30;
    return Math.min(600, Math.max(5, raw));
  }, []);

  const [subDeptList, setSubDeptList] = useState<SubDept[]>([]);
  const [rotationIndex, setRotationIndex] = useState(0);

  // Fetch sub-departments when rotation is enabled (public RPC, no auth required)
  useEffect(() => {
    if (!rotateEnabled || !departmentId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('list_screen_display_sub_departments', {
        p_department_id: departmentId,
      });
      if (cancelled) return;
      const list = ((data as any[]) || []).map((r) => ({ id: r.id, name: r.name })) as SubDept[];
      setSubDeptList(list);
      if (initialSubDepartmentId) {
        const idx = list.findIndex((s) => s.id === initialSubDepartmentId);
        if (idx >= 0) setRotationIndex(idx);
      }
    })();
    return () => { cancelled = true; };
  }, [rotateEnabled, departmentId, initialSubDepartmentId]);

  const rotationActive = rotateEnabled && !!departmentId && subDeptList.length >= 2;
  const activeSubDept = rotationActive
    ? subDeptList[rotationIndex % subDeptList.length]
    : null;
  const subDepartmentId = rotationActive
    ? (activeSubDept?.id ?? null)
    : initialSubDepartmentId;

  // Rotation interval
  useEffect(() => {
    if (!rotationActive) return;
    const timer = setInterval(() => {
      setRotationIndex((i) => (i + 1) % subDeptList.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [rotationActive, subDeptList.length, intervalSeconds]);

  // Sync subDepartmentId to URL on rotation
  useEffect(() => {
    if (!rotationActive || !activeSubDept) return;
    const url = new URL(window.location.href);
    url.searchParams.set('subDepartmentId', activeSubDept.id);
    window.history.replaceState({}, '', url.toString());
  }, [rotationActive, activeSubDept]);

  const selectedDateStr = showAllAssignments ? '' : format(selectedDate, 'yyyy-MM-dd');

  if (import.meta.env.DEV) {
    console.log('[ScreenDisplayPage] DATA FETCHING:', {
      selectedDateStr,
      showAllAssignments,
      departmentId,
      subDepartmentId,
      rotationActive,
      rotationIndex,
      timestamp: new Date().toISOString()
    });
  }

  const { assignments, loading, error, refetch } = useScreenDisplayData(selectedDateStr, departmentId, subDepartmentId);
  const absencesDate = selectedDateStr || format(new Date(), 'yyyy-MM-dd');
  const { absences } = useScreenDisplayAbsences(absencesDate, departmentId);

  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refetch]);

  // Realtime: refetch when assignments/team/vacations change for this department
  useEffect(() => {
    if (!departmentId) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const triggerRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (import.meta.env.DEV) console.log('[ScreenDisplayPage] Realtime change → refetch');
        refetch();
      }, 1000);
    };

    const channel = supabase
      .channel(`screen-display-${departmentId}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'assignments', filter: `department_id=eq.${departmentId}` }, triggerRefetch)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'assignments_employees' }, triggerRefetch)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'vacations' }, triggerRefetch)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'trainings' }, triggerRefetch)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'cars' }, triggerRefetch)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'on_call_duties' }, triggerRefetch)
      .subscribe();


    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [departmentId, refetch]);

  // Midnight rollover + visibility/focus catch-up:
  // - Auto-advances selectedDate to "today" at 00:00:05
  // - Also catches up if the tab was asleep (visibilitychange/focus) and the
  //   stored date is no longer today
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const jumpToTodayIfStale = (alwaysRefetch = true) => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const currentStr = format(selectedDate, 'yyyy-MM-dd');
      const stale = currentStr !== todayStr;
      if (stale) {
        if (import.meta.env.DEV) console.log('[ScreenDisplayPage] Stale date detected → jumping to today');
        setSelectedDate(today);
        const url = new URL(window.location.href);
        url.searchParams.set('date', todayStr);
        window.history.replaceState({}, '', url.toString());
      }
      if (stale || alwaysRefetch) refetch();
    };

    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 5, 0); // 5 seconds past midnight for safety
      const ms = next.getTime() - now.getTime();
      timeoutId = setTimeout(() => {
        if (import.meta.env.DEV) console.log('[ScreenDisplayPage] Midnight rollover → today');
        jumpToTodayIfStale();
        scheduleMidnight();
      }, ms);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        jumpToTodayIfStale();
      }
    };

    // Safety net for kiosk screens that never get focus/visibility events and
    // where a long setTimeout may drift or be throttled: check every minute.
    const minuteTicker = setInterval(() => jumpToTodayIfStale(false), 60_000);

    scheduleMidnight();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(minuteTicker);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [refetch, selectedDate]);



  useEffect(() => {
    const handleUrlChange = () => {
      if (import.meta.env.DEV) console.log('[ScreenDisplayPage] URL CHANGED, refreshing date');
      const newDate = getInitialDate();
      setSelectedDate(newDate);
    };

    const isNewWindow = window.opener !== null;
    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get('source');
    
    if (isNewWindow && sourceParam === 'button') {
      if (import.meta.env.DEV) console.log('[ScreenDisplayPage] NEW WINDOW FROM BUTTON');
      const initialDate = getInitialDate();
      setSelectedDate(initialDate);
    } else {
      const initialDate = getInitialDate();
      if (initialDate.getTime() !== selectedDate.getTime()) {
        if (import.meta.env.DEV) console.log('[ScreenDisplayPage] INITIAL DATE UPDATE needed');
        setSelectedDate(initialDate);
      }
    }

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[ScreenDisplayPage] DATA STATE CHANGED:', {
        loading,
        error: error?.message,
        assignmentsCount: assignments?.length,
        selectedDateStr
      });
    }
  }, [loading, error, assignments, selectedDateStr]);

  const updateUrlDate = (date: Date) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('date', format(date, 'yyyy-MM-dd'));
    if (departmentId) newUrl.searchParams.set('departmentId', departmentId);
    if (subDepartmentId) newUrl.searchParams.set('subDepartmentId', subDepartmentId);
    if (rotateEnabled) newUrl.searchParams.set('rotate', 'true');
    if (rotateEnabled) newUrl.searchParams.set('interval', String(intervalSeconds));
    window.history.replaceState({}, '', newUrl.toString());
  };

  const rotationOverlay = rotationActive && activeSubDept ? (
    <>
      <div className="fixed top-3 right-3 z-50 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-md">
        {activeSubDept.name}
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          key={rotationIndex}
          className="h-full bg-primary"
          style={{
            width: '0%',
            animation: `screen-display-countdown ${intervalSeconds}s linear forwards`,
          }}
        />
      </div>
      <style>{`@keyframes screen-display-countdown { from { width: 100%; } to { width: 0%; } }`}</style>
    </>
  ) : null;

  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    updateUrlDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    updateUrlDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    updateUrlDate(today);
  };

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="min-h-screen w-full bg-background" aria-label="Loading assignments...">
        <ListSkeleton />
      </div>
    );
  } else if (error) {
    content = (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <Card className="border-2 border-destructive/20 bg-destructive/5 max-w-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Assignments</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    content = (
      <div className="min-h-screen w-full bg-background">
        <div className="w-full px-6 py-4 space-y-6">
          {!showAllAssignments && (
            <ScreenDisplayHeader
              selectedDate={selectedDate}
              onPreviousDay={handlePreviousDay}
              onNextDay={handleNextDay}
              onToday={handleToday}
              absences={absences}
            />
          )}

          {showAllAssignments && (
            <div className="text-center py-4">
              <h1 className="text-2xl font-bold text-foreground">All Published Assignments</h1>
              <p className="text-muted-foreground">Showing all published assignments across all dates</p>
            </div>
          )}

          <ScreenDisplayContent
            assignments={assignments}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    );
  }

  // INTENTIONAL: wrap the entire page (loading/error/success) so unexpected
  // render crashes in any branch fall back to the neutral kiosk screen.
  return (
    <ScreenDisplayErrorBoundary date={selectedDateStr} onRetry={refetch}>
      {content}
      {rotationOverlay}
    </ScreenDisplayErrorBoundary>
  );
};

export default ScreenDisplayPage;
