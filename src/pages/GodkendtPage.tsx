
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';

const GodkendtPage: React.FC = () => {
  const { t } = useTranslation();
  
  const headerComponent = (
    <PageHeader 
      title={t("navigation.approved")} 
      description={t("vacation.approvedPageDescription")}
    />
  );

  return (
    <>
      <VacationPageContainer headerComponent={headerComponent} showApproved={true} />
    </>
  );
};

export default GodkendtPage;
