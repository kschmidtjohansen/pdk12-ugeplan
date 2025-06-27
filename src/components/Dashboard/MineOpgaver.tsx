
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

  // FIXED: Filter to show tasks where current user is assigned, but display ALL assignees
  const userAssignments = useMemo(() => {
    if (!user?.id || !allAssignments) return [];

    return allAssignments.filter((assignment: Assignment) => {
      // Check if current user is assigned to this task
      const isUserAssigned = assignment.employees?.includes(user.name) || 
                           assignment.responsibleUser?.id === user.id;
      
      console.log(`[MineOpgaver] FIXED - Assignment "${assignment.title}":`, {
        userAssigned: isUserAssigned,
        allEmployees: assignment.employees,
        currentUser: user.name
      });
      
      return isUserAssigned;
    });
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
            {userAssignments.map((assignment) => (
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
                  
                  {/* FIXED: Display ALL assignees, not just current user */}
                  {assignment.employees && assignment.employees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {assignment.employees.join(', ')}
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MineOpgaver;
