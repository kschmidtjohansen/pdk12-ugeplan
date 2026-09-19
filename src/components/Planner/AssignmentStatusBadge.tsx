import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

interface AssignmentStatusBadgeProps {
  isPublished: boolean;
}

const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({ isPublished }) => {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        isPublished
          ? 'bg-success-soft text-success-soft-foreground border-success/20'
          : 'bg-warning-soft text-warning-soft-foreground border-warning/20'
      )}
    >
      {isPublished ? t('planner.published') : t('planner.notPublished')}
    </span>
  );

};

export default React.memo(AssignmentStatusBadge);
