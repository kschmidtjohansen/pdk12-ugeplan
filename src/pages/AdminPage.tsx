import React, { useState } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RealtimeDiagnostics from '@/components/Admin/RealtimeDiagnostics';
import { Shield, Users, Building2, MapPin, Activity, Radio, Clock, KeyRound, Gauge, ScanLine, ListTree, SlidersHorizontal, Bell, Home } from 'lucide-react';
import ScreenDisplayLinks from '@/components/Admin/ScreenDisplayLinks';
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
import PageHeader from '@/components/Layout/PageHeader';
import ScansPage from './ScansPage';
import FacetKpi from '@/components/shared/FacetKpi';
import { getRealtimeChannelDiagnostics } from '@/lib/realtimeChannels';

const AdminPage: React.FC = () => {
  const { user, loading, isDemoMode, demoRole } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { isWarehouseEnabled, departments } = useDepartment();
  const [tab, setTab] = useState('users');
  // Systemstatus: the app's realtime connections right now (re-read when the section changes)
  const realtime = React.useMemo(() => {
    const diag = getRealtimeChannelDiagnostics();
    return { total: diag.length, waiting: diag.filter((d) => d.status !== 'SUBSCRIBED').length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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
    <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5">
      <VacationCleanupHandler />

      <div className="space-y-6">
        {/* same page header as the other PolyPlan pages */}
        <PageHeader
          title="Admin"
          description={t('admin.description')}
          eyebrow={currentLanguage === 'en' ? 'Control panel' : 'Kontrolpanel'}
        />

        <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="grid w-full gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
          <TabsList aria-label={t('admin.title')} className="facet-admin-nav h-auto w-full flex-row flex-wrap items-stretch justify-start gap-0.5 rounded-card p-2 lg:sticky lg:top-20 lg:flex-col lg:flex-nowrap">
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
              <ListTree className="h-4 w-4" />
              {t('admin.tabs.subDepartments')}
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
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
                <Bell className="h-4 w-4" />
                {t('admin.tabs.broadcast')}
              </TabsTrigger>
            )}
            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="screens" className="gap-2">
                <Home className="h-4 w-4" />
                {currentLanguage === 'en' ? 'Screens' : 'Skærme'}
              </TabsTrigger>
            )}
            {(isSuperAdmin || isAdmin) && (
              <TabsTrigger value="operations" className="gap-2">
                <Activity className="h-4 w-4" />
                {currentLanguage === 'en' ? 'Operations' : 'Driftscenter'}
              </TabsTrigger>
            )}
            {isSuperAdmin && <TabsTrigger value="scans" className="gap-2"><ScanLine className="h-4 w-4" />3D-scanninger</TabsTrigger>}
          </TabsList>

          <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FacetKpi label={t('admin.tabs.users')} value={userCount ?? '–'} onClick={() => setTab('users')} />
            <FacetKpi label={t('admin.tabs.departments')} value={departments.length || '–'} onClick={isSuperAdmin ? () => setTab('departments') : undefined} />
            <FacetKpi
              label={currentLanguage === 'en' ? 'System status' : 'Systemstatus'}
              value={<span className={`inline-flex items-center gap-2 text-[1.5rem] ${realtime.waiting === 0 ? 'text-success' : 'text-warning-soft-foreground'}`}>
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${realtime.waiting === 0 ? 'bg-success shadow-[0_0_8px_hsl(var(--success)/0.8)]' : 'bg-warning'}`} />
                {realtime.waiting === 0
                  ? (currentLanguage === 'en' ? 'All running' : 'Alt kører')
                  : (currentLanguage === 'en' ? `${realtime.waiting} waiting` : `${realtime.waiting} venter`)}
              </span>}
              sub={currentLanguage === 'en' ? `${realtime.total} live connections` : `${realtime.total} realtidsforbindelser`}
              onClick={showOperations ? () => setTab('operations') : undefined}
            />
          </div>

          <TabsContent value="users" className="animate-fade-in">
            <UserManagement />
          </TabsContent>

          {isSuperAdmin && <TabsContent value="scans"><ScansPage adminSettings /></TabsContent>}

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
            <TabsContent value="screens" className="animate-fade-in">
              <ScreenDisplayLinks />
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
          </div>
        </Tabs>
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default AdminPage;
