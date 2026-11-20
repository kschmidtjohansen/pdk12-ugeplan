import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';

const VacationPage: React.FC = () => (
  <DataFetchErrorBoundary>
    <VacationPageContainer />
  </DataFetchErrorBoundary>
);

export default VacationPage;
