import React, { useState } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RealtimeDiagnostics from '@/components/Admin/RealtimeDiagnostics';
import { Shield, Users, Building2, Layers, Settings, MapPin, Activity, Radio, Clock, Megaphone, KeyRound, Gauge } from 'lucide-react';
import BroadcastNotification from '@/components/Admin/BroadcastNotification';
import BroadcastDeliveryStatus from '@/components/Admin/BroadcastDeliveryStatus';

import UserManagement from '@/components/Admin/UserManagement';
import DepartmentManagement from '@/components/Admin/DepartmentManagement';
import SubDepartmentManagement from '@/components/Admin/SubDepartmentManagement';
import FeatureToggleManagement from '@/components/Admin/FeatureToggleManagement';
import WeatherAlertSettings from '@/components/Admin/WeatherAlertSettings';
import LocationManagement from '@/components/Admin/LocationManagement';

import RolePermissionsManagement from '@/components/Admin/RolePermissionsManagement';
import OperationsCenter from '@/components/Admin/OperationsCenter';
import { canOpenOperationsCenter } from '@/utils/operationsCenter';
import { useQuery } from '@tanstack/react-query';
import WebVitalsOverview from '@/components/Admin/WebVitalsOverview';
import AutoPublishLogWidget from '@/components/Dashboard/AutoPublishLogWidget';
import VacationCleanupHandler from '@/components/Vacation/VacationCleanupHandler';
import { supabase } from '@/integrations/supabase/client';
import ListSkeleton from '@/components/shared/ListSkeleton';

const AdminPage: React.FC = () => {
  const { user, loading, isDemoMode, demoRole } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { isWarehouseEnabled } = useDepartment();
  const [tab, setTab] = useState('users');

  const effectiveRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isSuperAdmin = effectiveRole === 'super_admin';
  const isAdmin = effectiveRole === 'administrator' || isSuperAdmin;
  const showOperations = canOpenOperationsCenter(effectiveRole);
  const [opsTab, setOpsTab] = useState(showOperations ? 'overview' : 'diagnostics');

  // Cached head-count instead of a fetch on every mount.
  const { data: userCount = null } = useQuery({
    queryKey: ['admin', 'profiles-count', user?.id],
    enabled: !!user && isAdmin,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count ?? null;
    },
  });

  if (loading) {
    return <ListSkeleton />;
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

        <Tabs value={tab} onValueChange={setTab} className="w-full">
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

            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="broadcast" className="gap-2">
                <Megaphone className="h-4 w-4" />
                {t('admin.tabs.broadcast')}
              </TabsTrigger>
            )}
            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="operations" className="gap-2">
                <Gauge className="h-4 w-4" />
                {currentLanguage === 'en' ? 'Operations' : 'Driftscenter'}
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

          <TabsContent value="features" className="animate-fade-in space-y-4">
            <FeatureToggleManagement />
            <WeatherAlertSettings />
          </TabsContent>

          {isWarehouseEnabled && (isSuperAdmin || isAdmin) && (
            <TabsContent value="locations" className="animate-fade-in">
              <LocationManagement />
            </TabsContent>
          )}




          {(isSuperAdmin || isAdmin) && (
            <TabsContent value="broadcast" className="animate-fade-in space-y-4">
              <BroadcastNotification />
              <BroadcastDeliveryStatus />
            </TabsContent>

          )}

          {(isSuperAdmin || isAdmin) && (
            <TabsContent value="operations" className="animate-fade-in">
              <Tabs value={opsTab} onValueChange={setOpsTab} className="w-full space-y-4">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
                  {showOperations && (
                    <TabsTrigger value="overview" className="gap-2">
                      <Gauge className="h-4 w-4" />
                      {currentLanguage === 'en' ? 'Overview' : 'Overblik'}
                    </TabsTrigger>
                  )}
                  {isSuperAdmin && (
                    <TabsTrigger value="webVitals" className="gap-2">
                      <Activity className="h-4 w-4" />
                      Web Vitals
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="diagnostics" className="gap-2">
                    <Radio className="h-4 w-4" />
                    {t('admin.realtimeDiagnostics.title')}
                  </TabsTrigger>
                  <TabsTrigger value="autoPublish" className="gap-2">
                    <Clock className="h-4 w-4" />
                    {t('admin.tabs.autoPublish')}
                  </TabsTrigger>
                  {isSuperAdmin && (
                    <TabsTrigger value="rolePermissions" className="gap-2">
                      <KeyRound className="h-4 w-4" />
                      Rolle-rettigheder
                    </TabsTrigger>
                  )}
                </TabsList>

                {showOperations && (
                  <TabsContent value="overview">
                    <OperationsCenter onOpenBroadcast={() => setTab('broadcast')} onOpenWebVitals={() => setOpsTab('webVitals')} />
                  </TabsContent>
                )}

                {isSuperAdmin && (
                  <TabsContent value="webVitals">
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

                <TabsContent value="diagnostics">
                  <RealtimeDiagnostics />
                </TabsContent>

                <TabsContent value="autoPublish">
                  <AutoPublishLogWidget />
                </TabsContent>

                {isSuperAdmin && (
                  <TabsContent value="rolePermissions">
                    <Card>
                      <CardHeader>
                        <CardTitle>Rolle-rettigheder</CardTitle>
                        <CardDescription>
                          Giv en rolle ekstra adgang ud over det normale. Rollen beholder altid sin standardadgang. Gælder i de afdelinger medarbejderen har adgang til.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RolePermissionsManagement />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default AdminPage;
