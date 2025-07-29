import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useScreenDisplayData } from '@/hooks/useScreenDisplayData';
import { ScreenDisplayHeader } from '@/components/ScreenDisplay/ScreenDisplayHeader';
import { ScreenDisplayContent } from '@/components/ScreenDisplay/ScreenDisplayContent';
import { ScreenDisplayErrorBoundary } from '@/components/ScreenDisplay/ScreenDisplayErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

const ScreenDisplayPage: React.FC = () => {
  // Parse date from URL parameters or default to today
  const getInitialDate = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
      try {
        return parseISO(dateParam);
      } catch (error) {
        console.error('Error parsing date from URL:', dateParam, error);
      }
    }
    
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  
  // Get formatted date string for API call
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Fetch assignments using the new simplified hook
  const { assignments, loading, error, refetch } = useScreenDisplayData(selectedDateStr);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refetch]);

  // Listen for URL parameter changes
  useEffect(() => {
    const handleUrlChange = () => {
      const newDate = getInitialDate();
      setSelectedDate(newDate);
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

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

  // Loading state
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

  // Error state
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
          <ScreenDisplayHeader
            selectedDate={selectedDate}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
            onToday={handleToday}
          />
          
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