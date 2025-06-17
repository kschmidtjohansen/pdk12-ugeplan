
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, ArrowRight, UserCheck, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { useAssignmentActions } from '@/hooks/assignment/useAssignmentActions';
import WeekNavigation from './WeekNavigation';
import AssignmentDetailsDialog from './AssignmentDetailsDialog';
import AssignmentManagementDialog from './AssignmentManagementDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

interface WeeklyAssignmentsProps {
  assignments: Assignment[];
  selectedWeek: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onRefresh?: () => void;
}

const WeeklyAssignments: React.FC<WeeklyAssignmentsProps> = ({
  assignments,
  selectedWeek,
  onPreviousWeek,
  onNextWeek,
  onRefresh
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [managementMode, setManagementMode] = useState<'create' | 'edit'>('create');
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user can manage assignments
  const canManageAssignments = user?.role === 'administrator' || user?.role === 'skadeleder';

  const { createAssignment, updateAssignment, deleteAssignment } = useAssignmentActions(
    onRefresh || (() => {}),
    () => setIsManagementDialogOpen(false)
  );

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentDialogOpen(true);
  };

  const handleCreateAssignment = () => {
    setManagementMode('create');
    setAssignmentToEdit(null);
    setIsManagementDialogOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setManagementMode('edit');
    setAssignmentToEdit(assignment);
    setIsManagementDialogOpen(true);
  };

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    
    setIsLoading(true);
    try {
      console.log(`[WeeklyAssignments] Attempting to delete assignment:`, assignmentToDelete.id);
      const success = await deleteAssignment(assignmentToDelete.id);
      
      if (success) {
        toast({
          title: t('planner.assignmentDeleted'),
          description: t('planner.assignmentDeletedMsg'),
        });
        setIsDeleteDialogOpen(false);
        setAssignmentToDelete(null);
      } else {
        toast({
          title: t('common.error'),
          description: t('planner.errorDeletingAssignment'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[WeeklyAssignments] Delete error:', error);
      toast({
        title: t('common.error'),
        description: `${t('planner.errorDeletingAssignment')}: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAssignment = async (assignmentData: Partial<Assignment>) => {
    setIsLoading(true);
    try {
      console.log(`[WeeklyAssignments] Saving assignment data:`, assignmentData);
      
      if (managementMode === 'create') {
        await createAssignment(assignmentData);
      } else if (assignmentToEdit) {
        await updateAssignment(assignmentToEdit.id, assignmentData);
      }
    } catch (error) {
      console.error('[WeeklyAssignments] Save error:', error);
      toast({
        title: t('common.error'),
        description: managementMode === 'create' ? t('planner.errorCreatingAssignment') : t('planner.errorUpdatingAssignment'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize the sorted assignments to prevent unnecessary recalculations
  const sortedAssignments = useMemo(() => {
    return assignments.sort((a, b) => {
      const today = new Date().toISOString().split('T')[0];
      const aIsToday = a.date === today;
      const bIsToday = b.date === today;
      const aIsFuture = a.date > today;
      const bIsFuture = b.date > today;
      const aIsPast = a.date < today;
      const bIsPast = b.date < today;
      
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      if (aIsFuture && bIsPast) return -1;
      if (aIsPast && bIsFuture) return 1;
      if (a.date !== b.date) {
        if (aIsFuture && bIsFuture) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (aIsPast && bIsPast) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [assignments]);

  console.log('[WeeklyAssignments] Rendering assignments:', sortedAssignments.map(a => ({
    id: a.id,
    title: a.title,
    location: a.location,
    car: a.car,
    responsibleUser: a.responsibleUser,
    employees: a.employees
  })));

  return (
    <>
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card">
        <CardHeader className="pb-4">
          <CardTitle>
            {/* Responsive Header Layout */}
            <div className="flex flex-col gap-4">
              {/* Title and Navigation Row */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">
                    {t('dashboard.myAssignments', { week: selectedWeek })}
                  </h2>
                </div>
                <div className="flex-shrink-0">
                  <WeekNavigation 
                    onPrevious={onPreviousWeek} 
                    onNext={onNextWeek} 
                    currentWeek={selectedWeek} 
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex justify-between items-center gap-2">
                {canManageAssignments && (
                  <Button 
                    onClick={handleCreateAssignment}
                    size="sm"
                    className="shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{t('planner.newAssignment')}</span>
                    <span className="sm:hidden">{t('planner.create')}</span>
                  </Button>
                )}
                
                <Button variant="gradient" size="sm" asChild className="shadow-lg w-full sm:w-auto">
                  <Link to="/planner" className="flex items-center justify-center gap-2">
                    <span>{t('dashboard.viewAll')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAssignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {t('dashboard.noAssignments')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('dashboard.noAssignmentsScheduled')}
              </p>
              {canManageAssignments && (
                <Button onClick={handleCreateAssignment} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('planner.createFirst')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedAssignments.map((assignment, index) => (
                <div 
                  key={assignment.id} 
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="border-2 border-border/50 rounded-2xl p-4 bg-gradient-to-br from-card to-card/50 cursor-pointer animate-scale-in relative overflow-hidden py-[12px] hover:border-primary/30 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                      <div 
                        className="flex flex-col flex-1 cursor-pointer"
                        onClick={() => handleAssignmentClick(assignment)}
                      >
                        <h3 className="font-bold text-lg text-left">
                          {assignment.title || 'Untitled'}
                        </h3>
                        {assignment.location && (
                          <p className="text-sm text-gray-600 text-left">
                            {assignment.location}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold text-sm border border-primary/20">
                          {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                        </div>
                        
                        {canManageAssignments && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAssignment(assignment);
                              }}
                              className="h-8 w-8 p-0"
                              title={t('planner.editAssignment')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(assignment);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title={t('planner.deleteAssignment')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {assignment.description && (
                      <p className="mb-2 text-left leading-relaxed text-sm text-polygon-neutral">
                        {assignment.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Car information */}
                      {assignment.car && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
                            <Car className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-green-50 border border-green-200">
                          <Clock className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <span className="text-foreground font-medium text-sm">
                          {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
                        </span>
                      </div>
                      
                      {assignment.employees && assignment.employees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
                            <Users className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {assignment.employees.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Responsible user information */}
                      {assignment.responsibleUser && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
                            <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {typeof assignment.responsibleUser === 'string' ? assignment.responsibleUser : assignment.responsibleUser.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Details Dialog */}
      <AssignmentDetailsDialog 
        assignment={selectedAssignment} 
        isOpen={isAssignmentDialogOpen} 
        onClose={() => setIsAssignmentDialogOpen(false)} 
      />

      {/* Assignment Management Dialog */}
      {canManageAssignments && (
        <AssignmentManagementDialog
          isOpen={isManagementDialogOpen}
          onClose={() => setIsManagementDialogOpen(false)}
          assignment={assignmentToEdit}
          onSave={handleSaveAssignment}
          mode={managementMode}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              {t('planner.deleteConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('planner.deleteWarning')}
              {assignmentToDelete && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>{assignmentToDelete.title}</strong>
                  {assignmentToDelete.location && ` - ${assignmentToDelete.location}`}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('planner.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? t('common.loading') : t('planner.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WeeklyAssignments;
