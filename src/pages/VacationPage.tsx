import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import ListPageShell from '@/components/shared/ListPageShell';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DataFetchErrorBoundary>
      <ListPageShell workspace
        title={t('navigation.vacation')}
        description={t('vacation.pageDescription')}
      >
        <div className="min-w-0 py-4">
          <VacationPageContainer headerComponent={null} />
        </div>
      </ListPageShell>
    </DataFetchErrorBoundary>
  );
};

export default VacationPage;
