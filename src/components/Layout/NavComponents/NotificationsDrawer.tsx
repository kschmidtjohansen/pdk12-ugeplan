import React, { useEffect, useRef, useState } from 'react';
import { Bell, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';
import { da } from 'date-fns/locale';
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
  return (data ?? []).map((n: any) => ({
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
  } = useInfiniteQuery({
    queryKey,
    enabled: !!userId && open,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(userId!, pageParam as number),
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

  const rows: Row[] = data?.pages.flat() ?? [];
  const groups = groupNotifications(rows);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const handleRowClick = async (n: Row) => {
    if (!n.read) {
      await markAsRead(n.id);
      invalidate();
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
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
    <button
      key={n.id}
      onClick={() => handleRowClick(n)}
      className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group"
    >
      <span
        className={cn(
          'mt-1.5 h-2 w-2 rounded-full shrink-0',
          n.read ? 'bg-muted-foreground/40' : 'bg-primary'
        )}
        aria-label={n.read ? 'Læst' : 'Ulæst'}
      />
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</div>
        {n.message && (
          <div className="text-sm text-muted-foreground line-clamp-2">{n.message}</div>
        )}
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(n.date, { addSuffix: true, locale: da })}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
        onClick={(e) => handleDelete(e, n.id)}
        aria-label="Slet notifikation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </button>
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
          className="relative h-8 w-8 overflow-visible"
          aria-label="Notifikationer"
        >
          <Bell className="h-[15px] w-[15px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center leading-none z-[100]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-base">Notifikationer</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-[12px] mx-[40px]"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
          >
            Marker alle som læst
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
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Ingen notifikationer
            </div>
          ) : (
            <>
              {renderGroup('I dag', groups.today)}
              {renderGroup('Denne uge', groups.week)}
              {renderGroup('Tidligere', groups.older)}
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
