
import { useToast } from '@/hooks/use-toast';
import { notifyOwnAction } from '@/lib/realtimeUtils';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { Employee } from '@/types/employee';
import { validateAndSanitizePhone } from '@/utils/phoneValidation';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { fetchPostnrCoords } from '@/hooks/useDawaPostnrLookup';
import { PlannerChangeLogger } from '@/services/plannerChangeLogger';
import { useDepartment } from '@/context/DepartmentContext';

export const useEmployeeActions = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();

  const toggleEmployeeLeave = async (employee: Employee, setOnLeave: boolean, notes: string | null = null) => {
    notifyOwnAction();
    try {
      if (import.meta.env.DEV) console.log('[useEmployeeActions] Updating employee leave status:', {
        employeeId: employee.id,
        onLeave: setOnLeave
      });
      
      const client = getSchemaClient(isDemoMode);
      const { error } = await client
        .from('profiles')
        .update({ 
          on_leave: setOnLeave,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);
      
      if (error) throw error;
      
      // NOTE: Marking someone "on leave" has no end date, so we deliberately do NOT
      // auto-remove them from future assignments (that was destructive and irreversible).
      // Assignment cleanup only happens for approved absences with a bounded date range.
      const cleanupSummary = '';


      toast({
        title: setOnLeave 
          ? t('employees.employeeOnLeave') 
          : t('employees.employeeAvailable'),
        description: (setOnLeave 
          ? t('employees.employeeOnLeaveMsg', { name: employee.name }) 
          : t('employees.employeeAvailableMsg', { name: employee.name })) + cleanupSummary
      });
      
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      await refreshEmployees();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useEmployeeActions] Error:', err);
      toast({
        title: t('common.error'),
        description: t('employees.updateError'),
        variant: 'destructive',
      });
      return false;
    }
  };


  const updateEmployee = async (employee: Employee, formData: any) => {
    notifyOwnAction();
    try {
      if (import.meta.env.DEV) console.log('[useEmployeeActions] Updating employee:', {
        employeeId: employee.id,
        roleChange: employee.role !== formData.role
      });
      
      // Validate phone number
      const phoneValidation = validateAndSanitizePhone(formData.phone);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || 'Invalid phone number format');
      }
      
      // Update profile via DB
      const client = getSchemaClient(isDemoMode);
      
      if (import.meta.env.DEV) console.log('[useEmployeeActions] Certificate values being sent:', {
        has_asbestos_certificate: formData.has_asbestos_certificate ?? false,
        has_pcb_certificate: formData.has_pcb_certificate ?? false,
        has_trailer_license: formData.has_trailer_license ?? false,
        has_forklift_license: formData.has_forklift_license ?? false
      });
      
      // Prepare update payload
      const updatePayload: Record<string, any> = {
        name: formData.name,
        email: formData.email,
        phone: phoneValidation.sanitized,
        job_title: formData.jobTitle || null,
        on_leave: formData.onLeave || false,
        notes: formData.notes || null,
        has_asbestos_certificate: formData.has_asbestos_certificate ?? false,
        has_pcb_certificate: formData.has_pcb_certificate ?? false,
        has_trailer_license: formData.has_trailer_license ?? false,
        has_forklift_license: formData.has_forklift_license ?? false,
        home_postcode: formData.home_postcode || null,
        home_address: formData.home_address || null,
        updated_at: new Date().toISOString()
      };

      // Fetch GPS coordinates if home_postcode changed
      if (formData.home_postcode && formData.home_postcode !== employee.home_postcode) {
        const coords = await fetchPostnrCoords(formData.home_postcode);
        if (coords) {
          updatePayload.lat = coords.lat;
          updatePayload.lng = coords.lng;
        }
      }

      // Handle vikar to permanent conversion
      if ('is_temporary' in formData) {
        updatePayload.is_temporary = formData.is_temporary;
        if (formData.is_temporary === false) {
          updatePayload.expires_at = null;
        }
      }

      const { error: profileError } = await client
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(updatePayload as any)
        .eq('id', employee.id);
      
      if (profileError) throw profileError;
      
      // Handle role(s) update if changed (skip in demo mode — edge function won't work for demo users)
      const incomingRoles: string[] = Array.isArray(formData.roles) && formData.roles.length
        ? Array.from(new Set(formData.roles as string[]))
        : [formData.role];
      const currentRoles = (employee.roles && employee.roles.length
        ? employee.roles
        : [employee.role]) as string[];
      const rolesChanged =
        incomingRoles.length !== currentRoles.length ||
        incomingRoles.some(r => !currentRoles.includes(r));

      if (rolesChanged && !isDemoMode) {
        const { error: roleError } = await supabase.functions.invoke('admin-user-role', {
          body: {
            userId: employee.id,
            roles: incomingRoles
          }
        });

        if (roleError) throw roleError;
      }

      // Persist sub-department assignment (per current department)
      if (!isDemoMode && 'sub_department_id' in formData) {
        try {
          // Hent brugerens user_access rækker (vi opdaterer alle rækker for brugeren
          // hvis vi ikke har en aktiv afdelings-kontekst, ellers kun for den aktive)
          const { data: accessRows } = await supabase
            .from('user_access')
            .select('id, department_id')
            .eq('user_id', employee.id);

          if (accessRows && accessRows.length > 0) {
            // Hvis underafdelingen tilhører en specifik afdeling, opdatér kun den række
            let targetDeptId: string | null = null;
            if (formData.sub_department_id) {
              const { data: subDept } = await supabase
                .from('sub_departments')
                .select('department_id')
                .eq('id', formData.sub_department_id)
                .maybeSingle();
              targetDeptId = (subDept as any)?.department_id || null;
            }

            const rowsToUpdate = targetDeptId
              ? accessRows.filter((r: any) => r.department_id === targetDeptId)
              : accessRows;

            for (const row of rowsToUpdate) {
              await supabase
                .from('user_access')
                .update({ sub_department_id: formData.sub_department_id || null })
                .eq('id', (row as any).id);
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn('[useEmployeeActions] sub_department_id update failed:', e);
        }
      }

      if (!isDemoMode) {
        await PlannerChangeLogger.logEmployeeUpdated(employee.id, formData.name, selectedDepartmentId);
      }
      
      toast({
        title: t('employees.employeeUpdated'),
        description: t('employees.employeeUpdatedMsg', { name: formData.name })
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      await refreshEmployees();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useEmployeeActions] Update error:', err);
      const errorMessage = err instanceof Error ? err.message : t('employees.updateError');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteEmployee = async (employeeId: string, allEmployees: Employee[]) => {
    notifyOwnAction();
    try {
      const employee = allEmployees.find(e => e.id === employeeId);
      if (!employee) throw new Error('Employee not found');
      
      if (import.meta.env.DEV) console.log('[useEmployeeActions] Deleting employee:', employeeId);
      
      if (isDemoMode) {
        // Demo mode: delete from DB with is_demo guard
        const client = getSchemaClient(isDemoMode);
        const { error } = await client
          .from('profiles')
          .delete()
          .eq('id', employeeId)
          .eq('is_demo', true);
        
        if (error) throw error;

        toast({
          title: t('employees.employeeDeleted'),
          description: t('employees.employeeDeletedMsg', { name: employee.name })
        });
        
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        await refreshEmployees();
        return true;
      }
      
      const { data, error } = await supabase.functions.invoke('admin-user-delete', {
        body: { userId: employeeId }
      });
      
      if (error) {
        // Supabase-klienten skjuler serverens svar ved non-2xx — læs det rigtige svar
        let serverMessage: string | null = null;
        const ctx: any = (error as any)?.context;
        if (ctx && typeof ctx.clone === 'function') {
          try {
            const body = await ctx.clone().json();
            if (body?.error) serverMessage = String(body.error);
          } catch {
            try {
              const text = await ctx.clone().text();
              if (text) serverMessage = text;
            } catch { /* ignore */ }
          }
        }
        throw new Error(serverMessage || `Server error: ${error.message}`);
      }
      if (data?.error) throw new Error(data.error);

      await PlannerChangeLogger.logEmployeeDeleted(employeeId, employee.name, selectedDepartmentId);
      
      toast({
        title: t('employees.employeeDeleted'),
        description: t('employees.employeeDeletedMsg', { name: employee.name })
      });
      
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      await refreshEmployees();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useEmployeeActions] Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : t('employees.deleteError');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave
  };
};
