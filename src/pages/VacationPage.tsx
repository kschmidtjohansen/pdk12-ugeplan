import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import ListPageShell from '@/components/shared/ListPageShell';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DataFetchErrorBoundary>
      <ListPageShell
        title={t('navigation.vacation')}
        description={t('vacation.pageDescription')}
      >
        <div className="p-4 sm:p-6">
          <VacationPageContainer headerComponent={null} />
        </div>
      </ListPageShell>
    </DataFetchErrorBoundary>
  );
};

export default VacationPage;
