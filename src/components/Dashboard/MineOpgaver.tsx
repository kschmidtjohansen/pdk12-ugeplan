
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { Assignment } from '@/types/assignment';

const MineOpgaver: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { allAssignments, loading } = useDashboard();

  // DEBUG: Log component props to diagnose employee filtering
  console.log('MineOpgaver.assignments prop:', JSON.stringify(allAssignments?.slice(0, 3), null, 2));

  const userAssignments = useMemo(() => {
    if (!user?.id || !allAssignments) {
      console.log(`[MineOpgaver] Missing user or assignments:`, {
        hasUser: !!user?.id,
        hasAssignments: !!allAssignments,
        assignmentCount: allAssignments?.length || 0
      });
      return [];
    }

    // CRITICAL FIX: Just return all assignments - they're already filtered by the service
    console.log(`[MineOpgaver] Using ALL assignments from service (already user-filtered):`, {
      totalAssignments: allAssignments.length,
      employeeBreakdown: allAssignments.map(a => ({
        title: a.title,
        employees: a.employees,
        employeeCount: a.employees?.length || 0,
        shouldShowAll: 'YES - All colleague names should be visible'
      }))
    });

    return allAssignments;
  }, [allAssignments, user]);

  console.log(`[MineOpgaver] FINAL RENDER VERIFICATION:`, {
    totalToRender: userAssignments.length,
    renderingDetails: userAssignments.map(a => ({
      title: a.title,
      willRenderEmployees: a.employees?.join(', ') || 'NO EMPLOYEES',
      expectedForAsbestkursus: a.title.toLowerCase().includes('asbestkursus') ? 
        'SHOULD RENDER: Mark Hansen, Julie Mortensen' : 'N/A'
    }))
  });

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

  return (
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
              
              console.log(`[MineOpgaver] Rendering assignment "${assignment.title}":`, {
                employees: employeeList,
                employeeCount: employeeList.length,
                actualDisplayText: employeeList.join(', '),
                isAsbestkursus: assignment.title.toLowerCase().includes('asbestkursus'),
                expectedForAsbestkursus: assignment.title.toLowerCase().includes('asbestkursus') ? 
                  'SHOULD DISPLAY: Mark Hansen, Julie Mortensen' : 'N/A'
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
                    
                    {/* CRITICAL FIX: Display ALL assignees, not just current user */}
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
  );
};

export default MineOpgaver;
