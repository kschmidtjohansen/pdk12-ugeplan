import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import ListPageShell from '@/components/shared/ListPageShell';
import { useDepartment } from '@/context/DepartmentContext';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();
  const { selectedDepartment } = useDepartment();

  return (
    <DataFetchErrorBoundary>
      <ListPageShell workspace className="border-t-0 bg-transparent"
        title={t('navigation.vacation')}
        description={t('vacation.pageDescription')}
        eyebrow={selectedDepartment?.name}
      >
        <div className="min-w-0 pt-3">
          <VacationPageContainer headerComponent={null} />
        </div>
      </ListPageShell>
    </DataFetchErrorBoundary>
  );
};

export default VacationPage;
