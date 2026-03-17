
import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DataFetchErrorBoundary>
      <div className="space-y-4">
        {/* Simple Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("navigation.vacation")}</h1>
          <p className="text-sm text-muted-foreground">{t("vacation.pageDescription")}</p>
        </div>

        {/* Vacation Content */}
        <div className="glass-card rounded-lg border">
          <div className="p-4">
            <VacationPageContainer headerComponent={null} />
          </div>
        </div>
      </div>
    </DataFetchErrorBoundary>
  );
};

export default VacationPage;
