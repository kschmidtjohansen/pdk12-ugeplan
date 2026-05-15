
import { useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, getISOWeek } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';

export const useVacationNotifications = (
  user: any | null,
  addNotification: (notification: any) => Promise<string | null>
) => {
  const { t, currentLanguage } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  
  // Create notifications for pending vacation requests
  const createNotificationsForPendingRequests = useCallback(async () => {
    if (!user || user.role !== 'administrator' || !selectedDepartmentId) {
      return;
    }
    
    try {
      const { data: pendingVacations, error } = await supabase
        .from('vacations')
        .select(`id, user_id, start_date, end_date, reason, status`)
        .eq('status', 'pending')
        .eq('department_id', selectedDepartmentId);
        
      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching pending vacations:', error);
        return;
      }
      
      if (!pendingVacations || pendingVacations.length === 0) {
        return;
      }
      
      const userIds = pendingVacations.map(v => v.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
        
      if (profilesError) {
        if (import.meta.env.DEV) console.error('Error fetching employee profiles:', profilesError);
      }
      
      const profileNameMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileNameMap.set(profile.id, profile.name);
        });
      }
      
      const { data: existingNotifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'vacation')
        .eq('read', false);
        
      if (notifError) {
        if (import.meta.env.DEV) console.error('Error checking existing notifications:', notifError);
        return;
      }
      
      for (const vacation of pendingVacations) {
        const employeeName = profileNameMap.get(vacation.user_id) || 'Employee';
        
        const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
        const formattedStartDate = format(new Date(vacation.start_date), dateFormat);
        const formattedEndDate = format(new Date(vacation.end_date), dateFormat);
        
        const hasNotification = existingNotifications?.some(n => {
          return n.message?.includes(employeeName) && 
                n.message?.includes(formattedStartDate) &&
                n.message?.includes(formattedEndDate);
        });
        
        if (!hasNotification) {
          const notifyMessage = t('notifications.newVacationRequestActionRequired', {
            name: employeeName,
            from: formattedStartDate,
            to: formattedEndDate
          });
          
          try {
            await addNotification({
              type: 'vacation',
              title: t('notifications.newVacationRequest'),
              message: notifyMessage,
              link: '/vacation'
            });
          } catch (notifErr) {
            if (import.meta.env.DEV) console.error('Error creating notification for pending request:', notifErr);
          }
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error checking for pending vacation requests:', err);
    }
  }, [user, t, currentLanguage, addNotification, selectedDepartmentId]);

  // Check if >50% of service employees have vacation in any upcoming week
  const checkHighVacationWeeks = useCallback(async () => {
    if (!user || user.role !== 'administrator' || !selectedDepartmentId) {
      return;
    }

    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const endDate = endOfWeek(addWeeks(weekStart, 7), { weekStartsOn: 1 });

      // Fetch approved vacations for the next 8 weeks
      const { data: approvedVacations, error: vacError } = await supabase
        .from('vacations')
        .select('user_id, start_date, end_date')
        .eq('status', 'approved')
        .eq('department_id', selectedDepartmentId)
        .lte('start_date', format(endDate, 'yyyy-MM-dd'))
        .gte('end_date', format(weekStart, 'yyyy-MM-dd'));

      if (vacError) {
        if (import.meta.env.DEV) console.error('Error fetching approved vacations for coverage check:', vacError);
        return;
      }

      // Fetch active service employees in this department
      const { data: serviceRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'servicemedarbejder');

      if (rolesError) {
        if (import.meta.env.DEV) console.error('Error fetching service roles:', rolesError);
        return;
      }

      const serviceUserIds = serviceRoles?.map(r => r.user_id) || [];
      if (serviceUserIds.length === 0) return;

      // Filter to those with access to this department
      const { data: accessData, error: accessError } = await supabase
        .from('user_access')
        .select('user_id')
        .eq('department_id', selectedDepartmentId)
        .in('user_id', serviceUserIds);

      if (accessError) {
        if (import.meta.env.DEV) console.error('Error fetching user access:', accessError);
        return;
      }

      // Only count active profiles
      const deptServiceUserIds = accessData?.map(a => a.user_id) || [];
      if (deptServiceUserIds.length === 0) return;

      const { data: activeProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', deptServiceUserIds)
        .eq('status', 'active');

      if (profileError) {
        if (import.meta.env.DEV) console.error('Error fetching active profiles:', profileError);
        return;
      }

      const totalServiceEmployees = activeProfiles?.length || 0;
      if (totalServiceEmployees === 0) return;

      // Check existing unread high-coverage notifications
      const { data: existingNotifs, error: existNotifError } = await supabase
        .from('notifications')
        .select('message')
        .eq('user_id', user.id)
        .eq('type', 'vacation')
        .eq('read', false);

      if (existNotifError) {
        if (import.meta.env.DEV) console.error('Error checking existing high-coverage notifications:', existNotifError);
        return;
      }

      // Check each of the next 8 weeks
      for (let i = 0; i < 8; i++) {
        const wStart = addWeeks(weekStart, i);
        const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        const weekNumber = getISOWeek(wStart);

        // Find unique employees on vacation this week
        const usersOnVacation = new Set<string>();
        if (approvedVacations) {
          for (const v of approvedVacations) {
            const vStart = new Date(v.start_date);
            const vEnd = new Date(v.end_date);
            // Check overlap with this week
            if (vStart <= wEnd && vEnd >= wStart) {
              if (activeProfiles?.some(p => p.id === v.user_id)) {
                usersOnVacation.add(v.user_id);
              }
            }
          }
        }

        const onVacationCount = usersOnVacation.size;
        const percentage = (onVacationCount / totalServiceEmployees) * 100;

        if (percentage > 50) {
          // Check if we already have an unread notification for this week
          const weekLabel = `${currentLanguage === 'da' ? 'Uge' : 'Week'} ${weekNumber}`;
          const alreadyNotified = existingNotifs?.some(n => 
            n.message?.includes(weekLabel) || n.message?.includes(`Week ${weekNumber}`) || n.message?.includes(`Uge ${weekNumber}`)
          );

          if (!alreadyNotified) {
            const message = t('notifications.vacationHighCoverage', {
              week: String(weekNumber),
              count: String(onVacationCount),
              total: String(totalServiceEmployees)
            });

            try {
              await addNotification({
                type: 'vacation',
                title: t('notifications.vacationHighCoverageTitle'),
                message,
                link: '/admin'
              });
            } catch (err) {
              if (import.meta.env.DEV) console.error('Error creating high vacation coverage notification:', err);
            }
          }
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error in checkHighVacationWeeks:', err);
    }
  }, [user, t, currentLanguage, addNotification, selectedDepartmentId]);

  // Run when user becomes an admin
  useEffect(() => {
    if (user?.role === 'administrator') {
      createNotificationsForPendingRequests();
      checkHighVacationWeeks();
    }
  }, [user?.role, createNotificationsForPendingRequests, checkHighVacationWeeks]);

  return {
    createNotificationsForPendingRequests,
    checkHighVacationWeeks
  };
};
