
import React from 'react';
import AutoPublishHandler from './AutoPublishHandler';
import VacationCleanupHandler from '../Vacation/VacationCleanupHandler';
import { useAuth } from '@/context/AuthContext';

/**
 * Container component that organizes all background process handlers
 * like auto-publishing and cleanup processes.
 */
const AutoPublishContainer: React.FC = () => {
  const { user } = useAuth();
  
  // Only render these components if the user is logged in
  if (!user) {
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
