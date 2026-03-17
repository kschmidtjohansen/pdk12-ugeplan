
import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import { Calendar } from 'lucide-react';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DataFetchErrorBoundary>
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-3 sm:px-4 lg:px-8 py-6 space-y-6">
        {/* Clean Card Header */}
        <div className="bg-card rounded-xl border border-border/40 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {t("navigation.vacation")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("vacation.pageDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* Vacation Content */}
        <div className="bg-card rounded-xl border border-border/40 shadow-sm">
          <div className="p-6">
            <VacationPageContainer headerComponent={null} />
          </div>
        </div>
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default VacationPage;
