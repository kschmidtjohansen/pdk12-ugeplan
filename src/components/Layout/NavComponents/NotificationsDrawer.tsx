import React, { useEffect, useRef, useState } from 'react';
import { Bell, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationType } from '@/types/notification';
import { safeNotificationLink } from '@/utils/notificationDelivery';
import { useTranslation } from '@/context/TranslationContext';

const PAGE_SIZE = 20;

type Row = NotificationType;

const fetchPage = async (userId: string, pageIndex: number): Promise<Row[]> => {
  const from = pageIndex * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link ?? undefined,
    read: n.read,
    date: new Date(n.created_at),
  }));
};

const groupNotifications = (rows: Row[]) => {
  const today: Row[] = [];
  const week: Row[] = [];
  const older: Row[] = [];
  for (const r of rows) {
    if (isToday(r.date)) today.push(r);
    else if (isThisWeek(r.date, { weekStartsOn: 1 })) week.push(r);
    else older.push(r);
  }
  return { today, week, older };
};

const NotificationsDrawer: React.FC = () => {
  const { user } = useAuth();
  const { unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const dateLocale = useDateLocale();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const userId = user?.id;
  const queryKey = ['notifications', 'infinite', userId];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isError,
  } = useInfiniteQuery({
    queryKey,
    enabled: !!userId && open,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => { if (!userId) return Promise.resolve([]); return fetchPage(userId, pageParam as number); },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
  });

  // Refetch when opening to pick up newly-arrived notifications.
  useEffect(() => {
    if (open && userId) refetch();
  }, [open, userId, refetch]);

  // Intersection observer for infinite scroll.
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: '100px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data]);

  const rows: Row[] = Array.from(new Map((data?.pages.flat() ?? []).map(n => [n.id, n])).values());
  const groups = groupNotifications(rows);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleRowClick = async (n: Row) => {
    if (!n.read) {
      await markAsRead(n.id);
      invalidate();
    }
    const link = safeNotificationLink(n.link);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    invalidate();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    invalidate();
  };

  const renderRow = (n: Row) => (
    <div
      key={n.id}
      className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group"
    >
      <span
        className={cn(
          'mt-1.5 h-2 w-2 rounded-full shrink-0',
          n.read ? 'bg-muted-foreground/40' : 'bg-primary'
        )}
        aria-label={n.read ? t('ui.read') : t('ui.unread')}
      />
      <Button variant="ghost" onClick={() => void handleRowClick(n)} className="flex-1 min-w-0 h-auto min-h-11 whitespace-normal text-left block px-0">
        <div className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</div>
        {n.message && (
          <div className="text-sm text-muted-foreground line-clamp-2">{n.message}</div>
        )}
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(n.date, { addSuffix: true, locale: dateLocale })}
        </div>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={(e) => handleDelete(e, n.id)}
        aria-label={t('ui.deleteNotification')}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  const renderGroup = (label: string, items: Row[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div>{items.map(renderRow)}</div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 overflow-visible md:h-9 md:w-9"
          aria-label={t('notifications.title')}
        >
          <Bell className="h-[15px] w-[15px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center leading-none z-[100]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-base">{t('notifications.title')}</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs min-h-11 px-2 mr-7 whitespace-normal"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
          >
            {t('notifications.markAllAsRead')}
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div role="alert" className="p-4 text-sm"><p>{t('common.errorLoadingData')}</p><Button variant="outline" onClick={() => void refetch()}>{da ? 'Prøv igen' : 'Retry'}</Button></div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t('notifications.noNotifications')}
            </div>
          ) : (
            <>
              {renderGroup(t('common.today'), groups.today)}
              {renderGroup(da ? 'Denne uge' : 'This week', groups.week)}
              {renderGroup(da ? 'Tidligere' : 'Earlier', groups.older)}
              <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                {isFetchingNextPage && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsDrawer;
