
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useOptimizedAssignments } from '@/hooks/useOptimizedAssignments';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { Assignment } from '@/types/assignment';

// Helper function to get employee names from assignment
const getEmployeeNames = (assignment: Assignment): string[] => {
  if (!assignment.employees) return [];
  
  if (Array.isArray(assignment.employees)) {
    // Handle both string[] and {id, name}[] formats
    return assignment.employees.map(emp => 
      typeof emp === 'string' ? emp : emp.name
    );
  }
  
  return [];
};

const MineOpgaver: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { assignments, loading, error, refetch } = useOptimizedAssignments('user');

  console.log('[MineOpgaver] Component rendered for user:', user?.name, 'role:', user?.role);
  console.log('[MineOpgaver] Assignments received:', assignments?.length || 0);

  const userAssignments = useMemo(() => {
    if (!user?.id || !assignments) {
      console.log('[MineOpgaver] Missing user or assignments:', {
        hasUser: !!user?.id,
        hasAssignments: !!assignments,
        assignmentCount: assignments?.length || 0
      });
      return [];
    }

    console.log('[MineOpgaver] Using assignments from service:', {
      totalAssignments: assignments.length,
      sampleAssignment: assignments[0] ? {
        title: assignments[0].title,
        employees: assignments[0].employees,
        date: assignments[0].date
      } : 'No assignments'
    });

    return assignments;
  }, [assignments, user]);

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
      <Card className="border-2 border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {t('dashboard.myTasks')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('common.error')}: {error.message}
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
                const employeeNames = getEmployeeNames(assignment);
                
                console.log('[MineOpgaver] Rendering assignment:', {
                  title: assignment.title,
                  employees: employeeNames,
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
                      
                      {employeeNames.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {employeeNames.join(', ')}
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
