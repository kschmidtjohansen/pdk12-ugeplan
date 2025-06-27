
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';

const MineOpgaver: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { allAssignments, loading, error, refetch } = useDashboard();

  console.log('[MineOpgaver] Component rendered for user:', user?.name, 'role:', user?.role);
  console.log('[MineOpgaver] Assignments received:', allAssignments?.length || 0);

  const userAssignments = useMemo(() => {
    if (!user?.id || !allAssignments) {
      console.log('[MineOpgaver] Missing user or assignments:', {
        hasUser: !!user?.id,
        hasAssignments: !!allAssignments,
        assignmentCount: allAssignments?.length || 0
      });
      return [];
    }

    console.log('[MineOpgaver] Using assignments from service:', {
      totalAssignments: allAssignments.length,
      sampleAssignment: allAssignments[0] ? {
        title: allAssignments[0].title,
        employees: allAssignments[0].employees,
        date: allAssignments[0].date
      } : 'No assignments'
    });

    return allAssignments;
  }, [allAssignments, user]);

  if (loading) {
    return (
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('dashboard.myTasks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">{t('common.loading')}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-destructive" />
            {t('dashboard.myTasks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">
              {t('common.error')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : String(error)}
            </p>
            <Button 
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DataFetchErrorBoundary>
      <Card className="border-2 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t('dashboard.myTasks')}
            <span className="text-sm font-normal text-muted-foreground">
              ({userAssignments.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userAssignments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {t('dashboard.noTasks')}
              </h3>
              <p className="text-muted-foreground">
                {t('dashboard.noTasksDescription')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userAssignments.map((assignment) => {
                const employeeList = Array.isArray(assignment.employees) ? assignment.employees : [];
                
                console.log('[MineOpgaver] Rendering assignment:', {
                  title: assignment.title,
                  employees: employeeList,
                  date: assignment.date
                });

                return (
                  <div
                    key={assignment.id}
                    className="border rounded-lg p-4 bg-gradient-to-br from-card to-card/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-foreground">{assignment.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(assignment.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {assignment.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {assignment.fromTime} - {assignment.toTime}
                        </span>
                      </div>
                      
                      {employeeList.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {employeeList.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {assignment.location && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          📍 {assignment.location}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DataFetchErrorBoundary>
  );
};

export default MineOpgaver;
