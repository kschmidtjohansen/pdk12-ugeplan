
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';

interface NotificationActionsProps {
  hasUnread: boolean;
  onMarkAllAsRead: () => void;
}

const NotificationActions: React.FC<NotificationActionsProps> = ({
  hasUnread,
  onMarkAllAsRead
}) => {
  const { t } = useTranslation();
  
  if (!hasUnread) return null;
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onMarkAllAsRead}
      className="text-xs h-7"
    >
      <Check className="mr-1 h-3 w-3" />
      {t('notifications.markAllAsRead')}
    </Button>
  );
};

export default NotificationActions;
