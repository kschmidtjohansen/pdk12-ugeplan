import React, { useState, useEffect } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building2, Layers, Settings, MapPin, CalendarDays } from 'lucide-react';
import UserManagement from '@/components/Admin/UserManagement';
import DepartmentManagement from '@/components/Admin/DepartmentManagement';
import SubDepartmentManagement from '@/components/Admin/SubDepartmentManagement';
import FeatureToggleManagement from '@/components/Admin/FeatureToggleManagement';
import LocationManagement from '@/components/Admin/LocationManagement';
import VacationCalendarOverview from '@/components/Admin/VacationCalendarOverview';
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
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (!error && count !== null) setUserCount(count);
    };
    fetchUserCount();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!isSuperAdmin && !isAdmin)) {
    return (
      <div className="py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>{t('accessDenied.message')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
      <div className="space-y-4">
        <VacationCleanupHandler />

        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">{t('admin.title')}</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="users" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              {t('admin.tabs.users')}
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="departments" className="gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5" />
                {t('admin.tabs.departments')}
              </TabsTrigger>
            )}
            <TabsTrigger value="subdepartments" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" />
              {t('admin.tabs.subDepartments')}
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" />
              {t('admin.tabs.features')}
            </TabsTrigger>
            {isWarehouseEnabled && (isSuperAdmin || isAdmin) && (
              <TabsTrigger value="locations" className="gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5" />
                {t('admin.tabs.locations') || 'Lokationer'}
              </TabsTrigger>
            )}
            <TabsTrigger value="vacationCalendar" className="gap-1.5 text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              {t('admin.tabs.vacationCalendar')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
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
            <TabsContent value="departments"><DepartmentManagement /></TabsContent>
          )}
          <TabsContent value="subdepartments"><SubDepartmentManagement /></TabsContent>
          <TabsContent value="features"><FeatureToggleManagement /></TabsContent>
          {isWarehouseEnabled && (isSuperAdmin || isAdmin) && (
            <TabsContent value="locations"><LocationManagement /></TabsContent>
          )}
          <TabsContent value="vacationCalendar"><VacationCalendarOverview /></TabsContent>
        </Tabs>
      </div>
    </DataFetchErrorBoundary>
  );
};

export default AdminPage;
