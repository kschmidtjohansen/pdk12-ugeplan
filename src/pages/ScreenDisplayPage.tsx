import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useScreenDisplayData } from '@/hooks/useScreenDisplayData';
import { ScreenDisplayHeader } from '@/components/ScreenDisplay/ScreenDisplayHeader';
import { ScreenDisplayContent } from '@/components/ScreenDisplay/ScreenDisplayContent';
import { ScreenDisplayErrorBoundary } from '@/components/ScreenDisplay/ScreenDisplayErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

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
        console.error('[ScreenDisplayPage] Error parsing date from URL:', dateParam, error);
      }
    }
    
    return new Date();
  };

  const shouldShowAllAssignments = () => {
    return false;
  };

  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  const [showAllAssignments] = useState(shouldShowAllAssignments);
  
  const selectedDateStr = showAllAssignments ? '' : format(selectedDate, 'yyyy-MM-dd');
  
  if (import.meta.env.DEV) {
    console.log('[ScreenDisplayPage] DATA FETCHING:', {
      selectedDateStr,
      showAllAssignments,
      timestamp: new Date().toISOString()
    });
  }
  
  const { assignments, loading, error, refetch } = useScreenDisplayData(selectedDateStr);

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
    window.history.replaceState({}, '', newUrl.toString());
  };

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

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading assignments...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
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
  }

  return (
    <ScreenDisplayErrorBoundary date={selectedDateStr} onRetry={refetch}>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
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
    </ScreenDisplayErrorBoundary>
  );
};

export default ScreenDisplayPage;
