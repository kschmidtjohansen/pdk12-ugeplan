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
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        isPublished
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
      )}
    >
      {isPublished ? t('planner.published') : t('planner.notPublished')}
    </span>
  );
};

export default React.memo(AssignmentStatusBadge);
