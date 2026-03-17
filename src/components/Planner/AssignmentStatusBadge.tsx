import React from 'react';
import { useTranslation } from '@/context/TranslationContext';

interface AssignmentStatusBadgeProps {
  isPublished: boolean;
}

const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({
  isPublished
}) => {
  const { t } = useTranslation();

  return isPublished ? (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
      {t('planner.published')}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
      {t('planner.notPublished')}
    </span>
  );
};

export default AssignmentStatusBadge;