import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import PageHeader from '@/components/Layout/PageHeader';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DataFetchErrorBoundary>
      <div className="min-h-screen w-full bg-background">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-5">
          <PageHeader
            title={t('navigation.vacation')}
            description={t('vacation.pageDescription')}
          />

          <div className="rounded-xl border border-border bg-card shadow-xs">
            <div className="p-4 sm:p-6">
              <VacationPageContainer headerComponent={null} />
            </div>
          </div>
        </div>
      </div>
    </DataFetchErrorBoundary>
  );
};

export default VacationPage;
