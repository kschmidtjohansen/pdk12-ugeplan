
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();
  
  const headerComponent = (
    <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-large animate-fade-in-up mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {t("navigation.vacation")}
          </h1>
          <p className="text-blue-100 text-lg">
            {t("vacation.pageDescription")}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {headerComponent}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <VacationPageContainer headerComponent={null} />
      </div>
    </div>
  );
};

export default VacationPage;
