
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();
  
  const headerComponent = (
    <PageHeader 
      title={t("navigation.vacation")} 
      description={t("vacation.pageDescription")}
    />
  );

  return (
    <>
      <VacationPageContainer headerComponent={headerComponent} />
    </>
  );
};

export default VacationPage;
