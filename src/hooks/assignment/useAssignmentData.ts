
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';

export const useAssignmentData = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch assignments from Supabase
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentData] Starting to fetch assignments...');
      
      // First, get all assignments with car information
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          car_id,
          published,
          created_at,
          updated_at,
          cars:car_id (id, name, car_number)
        `);
      
      if (assignmentsError) throw assignmentsError;
      
      console.log('[useAssignmentData] Raw assignments response:', assignmentsData);
      console.log('[useAssignmentData] Assignments count:', assignmentsData?.length || 0);
      
      if (assignmentsData) {
        // Get assignment-employee relationships
        const { data: assignmentEmployees, error: employeeError } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id');
        
        if (employeeError) throw employeeError;
        
        console.log('[useAssignmentData] Assignment employees response:', assignmentEmployees);
        console.log('[useAssignmentData] Assignment employees count:', assignmentEmployees?.length || 0);
        
        // Get all profiles for the users in assignments
        const userIds = assignmentEmployees?.map(ae => ae.user_id) || [];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          if (profilesError) throw profilesError;
          profilesData = profiles || [];
        }
        
        console.log('[useAssignmentData] Profiles response:', profilesData);
        console.log('[useAssignmentData] Profiles count:', profilesData?.length || 0);
        console.log('[useAssignmentData] Profile details:', profilesData.map(p => ({ id: p.id, name: p.name })));
        
        // Process and combine the data with enhanced debugging
        const processedAssignments = assignmentsData.map(assignment => {
          console.log(`[useAssignmentData] === PROCESSING ASSIGNMENT ${assignment.id} (${assignment.location}) ===`);
          
          // Special debugging for the "Fyn" assignment
          if (assignment.location === 'Fyn') {
            console.log(`[useAssignmentData] 🔍 DEBUGGING FYN ASSIGNMENT:`, {
              assignmentId: assignment.id,
              location: assignment.location,
              published: assignment.published,
              rawAssignment: assignment
            });
          }
          
          // Find all employees for this assignment
          const assignmentEmployeeIds = assignmentEmployees
            ?.filter(emp => emp.assignment_id === assignment.id)
            ?.map(emp => emp.user_id) || [];
          
          console.log(`  - Employee IDs from junction table: [${assignmentEmployeeIds.join(', ')}]`);
          
          // Special debugging for the "Fyn" assignment
          if (assignment.location === 'Fyn') {
            console.log(`[useAssignmentData] 🔍 FYN - Employee IDs found: [${assignmentEmployeeIds.join(', ')}]`);
            console.log(`[useAssignmentData] 🔍 FYN - Available profiles:`, profilesData.map(p => ({ id: p.id, name: p.name })));
          }
          
          // Map employee IDs to names with proper validation and error handling
          const assignmentEmployeeNames: string[] = [];
          
          assignmentEmployeeIds.forEach(userId => {
            const profile = profilesData.find(p => p.id === userId);
            console.log(`    - Looking for user ${userId}, found profile:`, profile);
            
            // Special debugging for the "Fyn" assignment
            if (assignment.location === 'Fyn') {
              console.log(`[useAssignmentData] 🔍 FYN - Looking for user ${userId}:`, {
                profile: profile,
                profileName: profile?.name,
                isValidName: profile?.name && typeof profile.name === 'string' && profile.name.trim() !== ''
              });
            }
            
            if (profile?.name && typeof profile.name === 'string' && profile.name.trim() !== '') {
              const trimmedName = profile.name.trim();
              assignmentEmployeeNames.push(trimmedName);
              console.log(`    - ✓ Added employee name: "${trimmedName}"`);
              
              // Special debugging for the "Fyn" assignment
              if (assignment.location === 'Fyn') {
                console.log(`[useAssignmentData] 🔍 FYN - ✓ Successfully added employee: "${trimmedName}"`);
              }
            } else {
              console.log(`    - ✗ Skipped invalid employee name for user ${userId}:`, profile?.name);
              
              // Special debugging for the "Fyn" assignment
              if (assignment.location === 'Fyn') {
                console.log(`[useAssignmentData] 🔍 FYN - ✗ Failed to add employee for user ${userId}:`, {
                  profile: profile,
                  profileName: profile?.name,
                  reason: !profile ? 'No profile found' : !profile.name ? 'No name in profile' : 'Invalid name format'
                });
              }
            }
          });
          
          console.log(`  - Employee Names resolved: [${assignmentEmployeeNames.join(', ')}]`);
          console.log(`  - Final employee array length: ${assignmentEmployeeNames.length}`);
          console.log(`  - Published status: ${assignment.published}`);
          
          // Special debugging for the "Fyn" assignment
          if (assignment.location === 'Fyn') {
            console.log(`[useAssignmentData] 🔍 FYN - FINAL RESULT:`, {
              employeeNames: assignmentEmployeeNames,
              employeeCount: assignmentEmployeeNames.length,
              published: assignment.published,
              willShowUnassigned: assignmentEmployeeNames.length === 0
            });
          }
          
          const processedAssignment: Assignment = {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description || '',
            date: assignment.assignment_date,
            fromTime: assignment.from_time,
            toTime: assignment.to_time,
            location: assignment.location,
            car: assignment.cars ? {
              id: assignment.cars.id,
              name: assignment.cars.name
            } : null,
            employees: assignmentEmployeeNames, // This is now guaranteed to be an array of valid strings
            published: assignment.published || false
          };
          
          console.log(`  - FINAL processed assignment employees: [${processedAssignment.employees.join(', ')}]`);
          console.log(`  - FINAL processed assignment:`, {
            id: processedAssignment.id,
            location: processedAssignment.location,
            employees: processedAssignment.employees,
            employeeCount: processedAssignment.employees.length,
            published: processedAssignment.published
          });
          
          // Special debugging for the "Fyn" assignment
          if (assignment.location === 'Fyn') {
            console.log(`[useAssignmentData] 🔍 FYN - FINAL PROCESSED ASSIGNMENT:`, processedAssignment);
          }
          
          return processedAssignment;
        });
        
        console.log('[useAssignmentData] === ALL FINAL PROCESSED ASSIGNMENTS ===');
        processedAssignments.forEach((assignment, index) => {
          console.log(`${index + 1}. ${assignment.location}: employees=[${assignment.employees.join(', ')}], published=${assignment.published}`);
          
          // Extra logging for Fyn assignment
          if (assignment.location === 'Fyn') {
            console.log(`[useAssignmentData] 🔍 FYN - FINAL IN LIST:`, {
              location: assignment.location,
              employees: assignment.employees,
              employeeCount: assignment.employees.length,
              published: assignment.published,
              shouldShowUnassigned: assignment.employees.length === 0
            });
          }
        });
        
        setAssignments(processedAssignments);
      } else {
        console.log('[useAssignmentData] No assignment data returned');
        setAssignments([]);
      }
    } catch (err) {
      console.error('[useAssignmentData] Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      toast({
        title: t('common.error'),
        description: t('planner.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);
  
  // Subscribe to assignment changes
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => {
          console.log('[useAssignmentData] Assignment table changed, refreshing...');
          fetchAssignments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments_employees'
        },
        () => {
          console.log('[useAssignmentData] Assignment employees table changed, refreshing...');
          fetchAssignments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    setAssignments
  };
};
