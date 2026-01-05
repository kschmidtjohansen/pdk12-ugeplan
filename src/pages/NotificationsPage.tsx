
import React, { useState, useMemo } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Bell, Check, Trash2, Search, Calendar, Briefcase, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationType } from '@/types/notification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const language = localStorage.getItem('polygon-language') || 'da';
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vacation':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'assignment':
        return <Briefcase className="h-5 w-5 text-green-500" />;
      case 'duty':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDateGroup = (date: Date): string => {
    if (isToday(date)) return t('common.today');
    if (isYesterday(date)) return t('common.yesterday');
    if (isThisWeek(date)) return t('notifications.thisWeek');
    return t('notifications.older');
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch = searchQuery === '' || 
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || notification.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [notifications, searchQuery, typeFilter]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationType[]> = {};
    
    filteredNotifications.forEach(notification => {
      const group = getDateGroup(notification.date);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(notification);
    });
    
    return groups;
  }, [filteredNotifications]);

  const handleNotificationClick = async (notification: NotificationType) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('notifications.pageTitle')}</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount} {t('notifications.new').toLowerCase()}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              {t('notifications.markAllAsRead')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={deleteAllNotifications} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('notifications.deleteAll')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('notifications.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('notifications.filterByType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('notifications.allTypes')}</SelectItem>
            <SelectItem value="vacation">{t('vacation.title')}</SelectItem>
            <SelectItem value="assignment">{t('planner.assignments')}</SelectItem>
            <SelectItem value="duty">{t('duty.title')}</SelectItem>
            <SelectItem value="system">{t('common.system')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery || typeFilter !== 'all' 
                ? t('notifications.noResults')
                : t('notifications.noNotifications')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
            <div key={group}>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">{group}</h2>
              <div className="space-y-3">
                {groupNotifications.map(notification => (
                  <Card 
                    key={notification.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      !notification.read && "border-primary/50 bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className={cn(
                                "font-medium",
                                !notification.read && "font-semibold"
                              )}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <span className="text-xs text-muted-foreground mt-2 block">
                                {format(notification.date, 'PPp', { locale: language === 'da' ? da : enUS })}
                              </span>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
