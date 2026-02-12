
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { isValidUUID } from '@/utils/uuidValidation';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const useEmployeeCreation = (refreshEmployees: () => Promise<void>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();

  // Direct database user creation fallback
  const createUserDirectly = async (userData: any) => {
    console.log('[useEmployeeCreation] Attempting direct database user creation');
    
    try {
      let userId: string;
      
      // For temporary users, skip Auth creation and generate UUID
      if (userData.is_temporary) {
        console.log('[useEmployeeCreation] Creating temporary user without Auth');
        userId = crypto.randomUUID();
      } else {
        // For regular users, create auth user
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
          console.error('[useEmployeeCreation] Auth user creation failed:', authError);
          throw new Error(`${t('employees.edgeFunctionFailed')}: ${authError.message}`);
        }

        if (!authUser.user?.id) {
          throw new Error(t('employees.unexpectedError'));
        }

        userId = authUser.user.id;
        console.log('[useEmployeeCreation] Auth user created:', userId);
      }

      // Create profile entry
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
          has_forklift_license: userData.has_forklift_license || false
        });

      if (profileError) {
        console.error('[useEmployeeCreation] Profile creation failed:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // Set user role
      const { error: roleError } = await client
        .from('user_roles')
        .insert({
          user_id: userId,
          role: userData.is_temporary ? 'vikar' : (userData.role || 'servicemedarbejder')
        });

      if (roleError) {
        console.error('[useEmployeeCreation] Role assignment failed:', roleError);
        throw new Error(`Role assignment failed: ${roleError.message}`);
      }

      console.log('[useEmployeeCreation] Direct user creation completed successfully');
      return { success: true, user: { id: userId } };

    } catch (err) {
      console.error('[useEmployeeCreation] Direct creation failed:', err);
      throw err;
    }
  };

  // Enhanced user creation with multiple fallback methods
  const createEmployee = async (formData: any) => {
    try {
      console.log('[useEmployeeCreation] Form data received:', {
        name: formData.name,
        email: formData.email,
        is_temporary: formData.is_temporary,
        hasPassword: !!formData.password
      });
      
      // Enhanced validation
      if (!formData.name) {
        throw new Error(t('employees.nameRequired'));
      }
      
      // For non-temporary users, validate email and password
      if (!formData.is_temporary) {
        console.log('[useEmployeeCreation] Validating regular employee - email and password required');
        if (!formData.email || !formData.password) {
          throw new Error(`Missing required fields: ${!formData.email ? 'Email' : ''} ${!formData.password ? 'password' : ''}`);
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          throw new Error(t('employees.validEmailRequired'));
        }
      } else {
        console.log('[useEmployeeCreation] Creating temporary user - skipping email/password validation');
      }


      console.log('[useEmployeeCreation] Starting user creation process');

      let result = null;
      let method = 'unknown';

      // Generate email for temporary users if not provided
      let finalEmail = formData.email;
      if (formData.is_temporary && (!finalEmail || !finalEmail.trim())) {
        const timestamp = Date.now();
        finalEmail = `vikar-${timestamp}@temp.local`;
      }

      // Method 1: Try edge function first
      try {
        console.log('[useEmployeeCreation] Attempting edge function creation');
        
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
            has_forklift_license: formData.has_forklift_license || false
          }
        };
        
        // Only add email and password for non-temporary users
        if (!formData.is_temporary) {
          requestBody.email = finalEmail;
          requestBody.password = formData.password;
        }
        
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: requestBody
        });
        
        if (error) {
          console.error('[useEmployeeCreation] Edge function error:', error);
          throw new Error(`${t('employees.edgeFunctionFailed')}: ${error.message}`);
        }
        
        if (data?.error) {
          console.error('[useEmployeeCreation] Edge function returned error:', data.error);
          throw new Error(data.error);
        }
        
        // Handle successful 2xx responses
        if (data && (data.user?.id || data.id)) {
          console.log('[useEmployeeCreation] Edge function succeeded:', data);
          result = data;
          method = 'edge-function';
        } else if (data?.message && data.message.includes('successfully')) {
          // Handle cases where function returns success message but different structure
          console.log('[useEmployeeCreation] Edge function succeeded with message:', data);
          result = data;
          method = 'edge-function';
        } else {
          console.error('[useEmployeeCreation] Edge function returned unexpected data:', data);
          throw new Error(t('employees.edgeFunctionFailed'));
        }
      } catch (edgeError) {
        console.log('[useEmployeeCreation] Edge function failed, trying direct method:', edgeError);
        
        // Method 2: Direct database creation
        try {
          const directFormData = { ...formData, email: finalEmail };
          result = await createUserDirectly(directFormData);
          method = 'direct-database';
        } catch (directError) {
          console.error('[useEmployeeCreation] Direct creation also failed:', directError);
          
          // Method 3: Last resort - create profile only (manual auth setup required)
          console.log('[useEmployeeCreation] Attempting profile-only creation');
          throw new Error(`${t('employees.allMethodsFailed')}. ${t('employees.edgeFunctionFailed')}: ${edgeError.message}. ${t('employees.directCreationFailed')}: ${directError.message}`);
        }
      }

      // If we got here, one method succeeded
      if (result?.user?.id || result?.success || result?.id || (result?.message && result.message.includes('successfully'))) {
        const userId = result.user?.id || result.id;
        
        // Update profile with additional fields if we have a valid ID
        if (userId && isValidUUID(userId)) {
          console.log('[useEmployeeCreation] Updating profile with additional data');
          
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
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (profileError) {
            console.warn('[useEmployeeCreation] Profile update warning:', profileError);
          }

          // Update role if specified and different from default
          const targetRole = formData.is_temporary ? 'vikar' : formData.role;
          if (targetRole && targetRole !== 'servicemedarbejder') {
            const { error: roleError } = await client
              .from('user_roles')
              .update({ role: targetRole })
              .eq('user_id', userId);
              
            if (roleError) {
              console.warn('[useEmployeeCreation] Role update warning:', roleError);
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
      console.error('[useEmployeeCreation] Creation error:', err);
      
      let errorMessage = t('employees.createError');
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Categorize errors for better user feedback
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
