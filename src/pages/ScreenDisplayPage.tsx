import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useScreenDisplayData } from '@/hooks/useScreenDisplayData';
import { ScreenDisplayHeader } from '@/components/ScreenDisplay/ScreenDisplayHeader';
import { ScreenDisplayContent } from '@/components/ScreenDisplay/ScreenDisplayContent';
import { ScreenDisplayErrorBoundary } from '@/components/ScreenDisplay/ScreenDisplayErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  // Fetch sub-departments when rotation is enabled
  useEffect(() => {
    if (!rotateEnabled || !departmentId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('sub_departments')
        .select('id, name')
        .eq('department_id', departmentId)
        .order('name');
      if (cancelled) return;
      const list = (data || []) as SubDept[];
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

  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refetch]);

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
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading assignments...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
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
