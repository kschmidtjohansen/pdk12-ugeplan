
import React from 'react';
import { useAutoPublishAssignments } from '@/hooks/useAutoPublishAssignments';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AutoPublishHandlerContent: React.FC = () => {
  // Call the hook to set up auto-publishing
  const { lastPublishedDate } = useAutoPublishAssignments();
  
  // Log that the component is initialized
  console.log('AutoPublishHandler initialized, last published:', lastPublishedDate);
  
  // Component doesn't render anything visible
  return null;
};

// Wrap the component with error boundary to prevent it from breaking the app
export const AutoPublishHandler: React.FC = () => {
  return (
    <ErrorBoundary fallback={<></>}>
      <AutoPublishHandlerContent />
    </ErrorBoundary>
  );
};

export default React.memo(AutoPublishHandler);
