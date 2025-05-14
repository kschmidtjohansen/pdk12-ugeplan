
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

const DashboardMetrics = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshAdminNotifications } = useNotifications();
  
  const isAdmin = user?.role === 'administrator';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Regular metric cards */}
      <Card className="text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t('dashboard.todaysAssignments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-polygon-purple">4</div>
          <p className="text-sm text-muted-foreground mt-2">{t('dashboard.assignmentsCreated')}</p>
        </CardContent>
      </Card>
      
      <Card className="text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t('dashboard.availableCars')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-green-600">3</div>
          <p className="text-sm text-muted-foreground mt-2">/{t('dashboard.totalCars', { count: 5 })}</p>
        </CardContent>
      </Card>
      
      <Card className="text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t('dashboard.employeesOnVacation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-amber-500">2</div>
          <p className="text-sm text-muted-foreground mt-2">/{t('dashboard.totalEmployees', { count: 12 })}</p>
        </CardContent>
      </Card>
      
      {/* Admin notification refresh button */}
      {isAdmin && (
        <Card className="text-center col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{t('dashboard.adminTools')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              onClick={refreshAdminNotifications}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('notifications.resetVacationNotifications')}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {t('dashboard.refreshAdminNotificationsDesc')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardMetrics;
