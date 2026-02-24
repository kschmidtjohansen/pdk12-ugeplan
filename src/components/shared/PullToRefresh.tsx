import React, { useState, useRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ 
  onRefresh, 
  children,
  disabled = false 
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isMobile = useIsMobile();

  // Only enable on mobile
  if (!isMobile || disabled) {
    return <>{children}</>;
  }

  const PULL_THRESHOLD = 80; // Pixels to pull before triggering refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    // Skip if touch originates inside a Drawer, overlay, or dialog
    const target = e.target as HTMLElement;
    if (target.closest('[data-vaul-drawer]') || target.closest('[data-vaul-overlay]') || target.closest('[role="dialog"]')) {
      return;
    }
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && distance < PULL_THRESHOLD * 2) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        if (import.meta.env.DEV) console.error('Refresh failed:', error);
      }
      setIsRefreshing(false);
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  const pullPercentage = Math.min((pullDistance / PULL_THRESHOLD) * 100, 100);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50"
          style={{ 
            height: `${Math.min(pullDistance, PULL_THRESHOLD)}px`,
            opacity: pullPercentage / 100 
          }}
        >
          <div className="flex flex-col items-center gap-1 pb-2">
            <Loader2 
              className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ 
                transform: isRefreshing ? undefined : `rotate(${pullPercentage * 3.6}deg)` 
              }}
            />
            <span className="text-xs text-muted-foreground font-medium">
              {isRefreshing ? 'Opdaterer...' : pullPercentage >= 100 ? 'Slip for at opdatere' : 'Træk ned'}
            </span>
          </div>
        </div>
      )}

      {/* Content with offset during pull */}
      <div
        style={{
          transform: `translateY(${isPulling && !isRefreshing ? pullDistance : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};
