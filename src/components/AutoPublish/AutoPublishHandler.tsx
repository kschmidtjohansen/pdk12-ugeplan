
import React from 'react';
import { useAutoPublishAssignments } from '@/hooks/useAutoPublishAssignments';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AutoPublishHandlerContent: React.FC = () => {
  useAutoPublishAssignments();
  return null;
};

export const AutoPublishHandler: React.FC = () => {
  return (
    <ErrorBoundary fallback={<></>}>
      <AutoPublishHandlerContent />
    </ErrorBoundary>
  );
};

export default React.memo(AutoPublishHandler);
