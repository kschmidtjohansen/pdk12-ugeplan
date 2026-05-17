import React, { useState, useEffect } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building2, Layers, Settings, MapPin, CalendarDays, Activity, Clock } from 'lucide-react';
import UserManagement from '@/components/Admin/UserManagement';
import DepartmentManagement from '@/components/Admin/DepartmentManagement';
import SubDepartmentManagement from '@/components/Admin/SubDepartmentManagement';
import FeatureToggleManagement from '@/components/Admin/FeatureToggleManagement';
import LocationManagement from '@/components/Admin/LocationManagement';
import VacationCalendarOverview from '@/components/Admin/VacationCalendarOverview';
import WebVitalsOverview from '@/components/Admin/WebVitalsOverview';
import VacationCleanupHandler from '@/components/Vacation/VacationCleanupHandler';
import { supabase } from '@/integrations/supabase/client';

const AdminPage: React.FC = () => {
  const { user, loading, isDemoMode, demoRole } = useAuth();
  const { t } = useTranslation();
  const { isWarehouseEnabled } = useDepartment();
  const [userCount, setUserCount] = useState<number | null>(null);

  const effectiveRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isSuperAdmin = effectiveRole === 'super_admin';
  const isAdmin = effectiveRole === 'administrator' || isSuperAdmin;

  useEffect(() => {
    const fetchUserCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) setUserCount(count);
    };
    fetchUserCount();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!isSuperAdmin && !isAdmin)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>{t('accessDenied.message')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
    <div className="container mx-auto px-4 py-8">
      <VacationCleanupHandler />

      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('admin.tabs.users')}
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="departments" className="gap-2">
                <Building2 className="h-4 w-4" />
                {t('admin.tabs.departments')}
              </TabsTrigger>
            )}
            <TabsTrigger value="subdepartments" className="gap-2">
              <Layers className="h-4 w-4" />
              {t('admin.tabs.subDepartments')}
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.tabs.features')}
            </TabsTrigger>
            {isWarehouseEnabled && (isSuperAdmin || isAdmin) && (
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="h-4 w-4" />
                {t('admin.tabs.locations') || 'Lokationer'}
              </TabsTrigger>
            )}
            <TabsTrigger value="vacationCalendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('admin.tabs.vacationCalendar')}
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="webVitals" className="gap-2">
                <Activity className="h-4 w-4" />
                Web Vitals
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="users" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.userManagement.title')}</CardTitle>
                <CardDescription>
                  {t('admin.userManagement.description')}
                  {userCount !== null && (
                    <span className="ml-2 text-muted-foreground">
                      — {t('admin.userManagement.totalCount').replace('{count}', String(userCount))}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="departments" className="animate-fade-in">
              <DepartmentManagement />
            </TabsContent>
          )}

          <TabsContent value="subdepartments" className="animate-fade-in">
            <SubDepartmentManagement />
          </TabsContent>

          <TabsContent value="features" className="animate-fade-in">
            <FeatureToggleManagement />
          </TabsContent>

          {isWarehouseEnabled && (isSuperAdmin || isAdmin) && (
            <TabsContent value="locations" className="animate-fade-in">
              <LocationManagement />
            </TabsContent>
          )}

          <TabsContent value="vacationCalendar" className="animate-fade-in">
            <VacationCalendarOverview />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="webVitals" className="animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Core Web Vitals</CardTitle>
                  <CardDescription>
                    LCP, INP, CLS, FCP og TTFB målt fra ægte brugersessions. Værdier vises som p75 pr. metric.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WebVitalsOverview />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default AdminPage;
