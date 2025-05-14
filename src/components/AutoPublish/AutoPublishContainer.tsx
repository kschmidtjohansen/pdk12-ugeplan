
import React from 'react';
import AutoPublishHandler from './AutoPublishHandler';
import VacationCleanupHandler from '../Vacation/VacationCleanupHandler';

interface AutoPublishContainerProps {
  userId?: string | null;
}

/**
 * Container component that organizes all background process handlers
 * like auto-publishing and cleanup processes.
 */
const AutoPublishContainer: React.FC<AutoPublishContainerProps> = ({ userId }) => {
  // Only render these components if the user is logged in
  if (!userId) {
    return null;
  }
  
  return (
    <>
      <AutoPublishHandler />
      <VacationCleanupHandler />
    </>
  );
};

export default AutoPublishContainer;
