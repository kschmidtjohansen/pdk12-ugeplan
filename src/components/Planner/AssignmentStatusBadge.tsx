import React from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { useTranslation } from '@/context/TranslationContext';
interface AssignmentStatusBadgeProps {
  isPublished: boolean;
}
const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({
  isPublished
}) => {
  const {
    t
  } = useTranslation();
  return isPublished ? <StatusBadge variant="success">
      {t('planner.published')}
    </StatusBadge> : <StatusBadge variant="warning">
      {t('planner.notPublished')}
    </StatusBadge>;
};
export default AssignmentStatusBadge;