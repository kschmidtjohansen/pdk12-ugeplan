
import React, { useEffect, useRef } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();
  const { fetchNotifications } = useNotifications();
  const { user } = useAuth();
  const hasFetchedRef = useRef(false);
  
  // Refresh notifications when visiting the vacation page, but only once
  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      console.log(`VacationPage: Refreshing notifications for user ${user?.id} (${user?.role})`);
      fetchNotifications();
      hasFetchedRef.current = true;
    }
  }, [fetchNotifications, user]);
  
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
