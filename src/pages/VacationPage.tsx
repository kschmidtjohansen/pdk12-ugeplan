
import React, { useEffect } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import { useNotifications } from '../context/NotificationContext';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();
  const { fetchNotifications } = useNotifications();
  
  // Refresh notifications when visiting the vacation page
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
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
