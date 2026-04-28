
import { useToast } from '@/hooks/use-toast';
import { notifyOwnAction } from '@/lib/realtimeUtils';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { isValidUUID } from '@/utils/uuidValidation';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useQueryClient } from '@tanstack/react-query';
import { fetchPostnrCoords } from '@/hooks/useDawaPostnrLookup';

export const useEmployeeCreation = (refreshEmployees: () => Promise<void>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();

  const createUserDirectly = async (userData: any) => {
    if (import.meta.env.DEV) console.log('[useEmployeeCreation] Attempting direct database user creation');
    
    try {
      let userId: string;
      
      if (userData.is_temporary) {
        if (import.meta.env.DEV) console.log('[useEmployeeCreation] Creating temporary user without Auth');
        userId = crypto.randomUUID();
      } else {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            phone: userData.phone,
            job_title: userData.jobTitle
          }
        });

        if (authError) {
          if (import.meta.env.DEV) console.error('[useEmployeeCreation] Auth user creation failed:', authError);
          throw new Error(`${t('employees.edgeFunctionFailed')}: ${authError.message}`);
        }

        if (!authUser.user?.id) {
          throw new Error(t('employees.unexpectedError'));
        }

        userId = authUser.user.id;
        if (import.meta.env.DEV) console.log('[useEmployeeCreation] Auth user created');
      }

      // Fetch GPS coordinates from postcode
      let lat: number | null = null;
      let lng: number | null = null;
      if (userData.home_postcode) {
        const coords = await fetchPostnrCoords(userData.home_postcode);
        if (coords) { lat = coords.lat; lng = coords.lng; }
      }

      const client = getSchemaClient(isDemoMode);
      const { error: profileError } = await client
        .from('profiles')
        .insert({
          id: userId,
          name: userData.name,
          email: userData.email || null,
          phone: userData.phone || null,
          job_title: userData.jobTitle || null,
          on_leave: userData.onLeave || false,
          notes: userData.notes || null,
          is_temporary: userData.is_temporary || false,
          expires_at: userData.is_temporary && userData.expires_at ? userData.expires_at : null,
          has_asbestos_certificate: userData.has_asbestos_certificate || false,
          has_trailer_license: userData.has_trailer_license || false,
          has_forklift_license: userData.has_forklift_license || false,
          home_postcode: userData.home_postcode || null,
          home_address: userData.home_address || null,
          lat,
          lng,
          ...(isDemoMode && { is_demo: true })
        });

      if (profileError) {
        if (import.meta.env.DEV) console.error('[useEmployeeCreation] Profile creation failed:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      const { error: roleError } = await client
        .from('user_roles')
        .insert({
          user_id: userId,
          role: userData.is_temporary ? 'vikar' : (userData.role || 'servicemedarbejder')
        });

      if (roleError) {
        if (import.meta.env.DEV) console.error('[useEmployeeCreation] Role assignment failed:', roleError);
        throw new Error(`Role assignment failed: ${roleError.message}`);
      }

      if (import.meta.env.DEV) console.log('[useEmployeeCreation] Direct user creation completed successfully');
      return { success: true, user: { id: userId } };

    } catch (err) {
      if (import.meta.env.DEV) console.error('[useEmployeeCreation] Direct creation failed:', err);
      throw err;
    }
  };

  const createEmployee = async (formData: any) => {
    notifyOwnAction();
    try {
      if (import.meta.env.DEV) console.log('[useEmployeeCreation] Form data received:', {
        name: formData.name,
        is_temporary: formData.is_temporary,
        hasPassword: !!formData.password
      });
      
      if (!formData.name) {
        throw new Error(t('employees.nameRequired'));
      }
      
      if (!formData.is_temporary) {
        if (import.meta.env.DEV) console.log('[useEmployeeCreation] Validating regular employee');
        if (!formData.email || !formData.password) {
          throw new Error(`Missing required fields: ${!formData.email ? 'Email' : ''} ${!formData.password ? 'password' : ''}`);
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          throw new Error(t('employees.validEmailRequired'));
        }
      } else {
        if (import.meta.env.DEV) console.log('[useEmployeeCreation] Creating temporary user - skipping email/password validation');
      }

      if (import.meta.env.DEV) console.log('[useEmployeeCreation] Starting user creation process');

      let result = null;
      let method = 'unknown';

      let finalEmail = formData.email;
      if (formData.is_temporary && (!finalEmail || !finalEmail.trim())) {
        const timestamp = Date.now();
        finalEmail = `vikar-${timestamp}@temp.local`;
      }

      // Method 1: Try edge function first
      try {
        if (import.meta.env.DEV) console.log('[useEmployeeCreation] Attempting edge function creation');
        
        // Fetch GPS coordinates before sending to edge function
        let lat: number | undefined;
        let lng: number | undefined;
        if (formData.home_postcode) {
          const coords = await fetchPostnrCoords(formData.home_postcode);
          if (coords) { lat = coords.lat; lng = coords.lng; }
        }

        const requestBody: any = {
          name: formData.name,
          role: formData.is_temporary ? 'vikar' : (formData.role || 'servicemedarbejder'),
          userData: {
            phone: formData.phone,
            job_title: formData.jobTitle,
            is_temporary: formData.is_temporary || false,
            expires_at: formData.is_temporary && formData.expires_at ? formData.expires_at : null,
            has_asbestos_certificate: formData.has_asbestos_certificate || false,
            has_trailer_license: formData.has_trailer_license || false,
            has_forklift_license: formData.has_forklift_license || false,
            home_postcode: formData.home_postcode || null,
            home_address: formData.home_address || null,
            lat: lat ?? null,
            lng: lng ?? null,
          }
        };
        
        if (!formData.is_temporary) {
          requestBody.email = finalEmail;
          requestBody.password = formData.password;
        }
        
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: requestBody
        });
        
        if (error) {
          if (import.meta.env.DEV) console.error('[useEmployeeCreation] Edge function error:', error);
          throw new Error(`${t('employees.edgeFunctionFailed')}: ${error.message}`);
        }
        
        if (data?.error) {
          if (import.meta.env.DEV) console.error('[useEmployeeCreation] Edge function returned error:', data.error);
          throw new Error(data.error);
        }
        
        if (data && (data.user?.id || data.id)) {
          if (import.meta.env.DEV) console.log('[useEmployeeCreation] Edge function succeeded');
          result = data;
          method = 'edge-function';
        } else if (data?.message && data.message.includes('successfully')) {
          if (import.meta.env.DEV) console.log('[useEmployeeCreation] Edge function succeeded with message');
          result = data;
          method = 'edge-function';
        } else {
          if (import.meta.env.DEV) console.error('[useEmployeeCreation] Edge function returned unexpected data');
          throw new Error(t('employees.edgeFunctionFailed'));
        }
      } catch (edgeError) {
        if (import.meta.env.DEV) console.log('[useEmployeeCreation] Edge function failed, trying direct method');
        
        // Method 2: Direct database creation
        try {
          const directFormData = { ...formData, email: finalEmail };
          result = await createUserDirectly(directFormData);
          method = 'direct-database';
        } catch (directError) {
          if (import.meta.env.DEV) console.error('[useEmployeeCreation] Direct creation also failed:', directError);
          throw new Error(`${t('employees.allMethodsFailed')}. ${t('employees.edgeFunctionFailed')}: ${edgeError.message}. ${t('employees.directCreationFailed')}: ${directError.message}`);
        }
      }

      if (result?.user?.id || result?.success || result?.id || (result?.message && result.message.includes('successfully'))) {
        const userId = result.user?.id || result.id;
        
        if (userId && isValidUUID(userId)) {
          if (import.meta.env.DEV) console.log('[useEmployeeCreation] Updating profile with additional data');
          
          const client = getSchemaClient(isDemoMode);
          const { error: profileError } = await client
            .from('profiles')
            .update({
              phone: formData.phone || null,
              job_title: formData.jobTitle || null,
              on_leave: formData.onLeave || false,
              notes: formData.notes || null,
              is_temporary: formData.is_temporary || false,
              expires_at: formData.is_temporary && formData.expires_at ? formData.expires_at : null,
              has_asbestos_certificate: formData.has_asbestos_certificate || false,
              has_trailer_license: formData.has_trailer_license || false,
              has_forklift_license: formData.has_forklift_license || false,
              home_postcode: formData.home_postcode || null,
              home_address: formData.home_address || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (profileError) {
            if (import.meta.env.DEV) console.warn('[useEmployeeCreation] Profile update warning:', profileError);
          }

          const targetRole = formData.is_temporary ? 'vikar' : formData.role;
          if (targetRole && targetRole !== 'servicemedarbejder') {
            const { error: roleError } = await client
              .from('user_roles')
              .update({ role: targetRole })
              .eq('user_id', userId);
              
            if (roleError) {
              if (import.meta.env.DEV) console.warn('[useEmployeeCreation] Role update warning:', roleError);
            }
          }

          // Tilknyt medarbejder til aktiv afdeling (spring over hvis skip_department)
          if (selectedDepartmentId && !formData.skip_department) {
            const accessRecord: any = {
              user_id: userId,
              department_id: selectedDepartmentId,
            };
            if (selectedSubDepartmentId) {
              accessRecord.sub_department_id = selectedSubDepartmentId;
            }
            const { error: accessError } = await client
              .from('user_access')
              .insert(accessRecord);
            if (accessError && import.meta.env.DEV) {
              console.warn('[useEmployeeCreation] user_access insert warning:', accessError);
            }

            const { error: homeDeptError } = await client
              .from('profiles')
              .update({ home_department_id: selectedDepartmentId })
              .eq('id', userId);
            if (homeDeptError && import.meta.env.DEV) {
              console.warn('[useEmployeeCreation] home_department_id update warning:', homeDeptError);
            }
          }
        }
        
        toast({
          title: t('employees.employeeCreated'),
          description: t('employees.employeeCreatedMsg', { name: formData.name })
        });
        
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        await refreshEmployees();
        return true;
      }
      
      throw new Error(t('employees.userCreationFailed'));
      
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useEmployeeCreation] Creation error:', err);
      
      let errorMessage = t('employees.createError');
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (errorMessage.includes('User already registered') || errorMessage.includes('email_address_already_registered')) {
          errorMessage = t('employees.userAlreadyExists');
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = t('employees.invalidEmail');
        } else if (errorMessage.includes('Password')) {
          errorMessage = t('employees.passwordRequirements');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to send a request')) {
          errorMessage = t('employees.networkError');
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = t('employees.rateLimitError');
        }
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    }
  };

  return { createEmployee };
};