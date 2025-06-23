
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/utils/uuidValidation';

export const useEmployeeCreation = (refreshEmployees: () => Promise<void>) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Direct database user creation fallback
  const createUserDirectly = async (userData: any) => {
    console.log('[useEmployeeCreation] Attempting direct database user creation');
    
    try {
      // First, try to create the auth user directly (this requires proper permissions)
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
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authUser.user?.id) {
        throw new Error('No user ID returned from authentication service');
      }

      console.log('[useEmployeeCreation] Auth user created:', authUser.user.id);

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          job_title: userData.jobTitle || null,
          on_leave: userData.onLeave || false,
          notes: userData.notes || null
        });

      if (profileError) {
        console.error('[useEmployeeCreation] Profile creation failed:', profileError);
        // Don't throw here, profile might already exist
      }

      // Set user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: userData.role || 'servicemedarbejder'
        });

      if (roleError) {
        console.error('[useEmployeeCreation] Role assignment failed:', roleError);
        // Don't throw here, role might already exist
      }

      console.log('[useEmployeeCreation] Direct user creation completed successfully');
      return { success: true, user: authUser.user };

    } catch (err) {
      console.error('[useEmployeeCreation] Direct creation failed:', err);
      throw err;
    }
  };

  // Enhanced user creation with multiple fallback methods
  const createEmployee = async (formData: any) => {
    try {
      // Enhanced validation
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('Email, password, and name are required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please provide a valid email address');
      }

      console.log('[useEmployeeCreation] Starting user creation process');

      let result = null;
      let method = 'unknown';

      // Method 1: Try edge function first
      try {
        console.log('[useEmployeeCreation] Attempting edge function creation');
        
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            userData: {
              name: formData.name,
              phone: formData.phone,
              job_title: formData.jobTitle
            }
          }
        });
        
        if (error) {
          console.error('[useEmployeeCreation] Edge function error:', error);
          throw new Error(`Edge function failed: ${error.message}`);
        }
        
        if (data?.error) {
          console.error('[useEmployeeCreation] Edge function returned error:', data.error);
          throw new Error(data.error);
        }
        
        if (data?.user?.id) {
          console.log('[useEmployeeCreation] Edge function succeeded');
          result = data;
          method = 'edge-function';
        } else {
          throw new Error('Edge function returned no user data');
        }
      } catch (edgeError) {
        console.log('[useEmployeeCreation] Edge function failed, trying direct method:', edgeError);
        
        // Method 2: Direct database creation
        try {
          result = await createUserDirectly(formData);
          method = 'direct-database';
        } catch (directError) {
          console.error('[useEmployeeCreation] Direct creation also failed:', directError);
          
          // Method 3: Last resort - create profile only (manual auth setup required)
          console.log('[useEmployeeCreation] Attempting profile-only creation');
          throw new Error(`All creation methods failed. Edge function: ${edgeError.message}. Direct: ${directError.message}`);
        }
      }

      // If we got here, one method succeeded
      if (result?.user?.id || result?.success) {
        const userId = result.user?.id || result.id;
        
        // Update profile with additional fields if we have a valid ID
        if (userId && isValidUUID(userId)) {
          console.log('[useEmployeeCreation] Updating profile with additional data');
          
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              phone: formData.phone || null,
              job_title: formData.jobTitle || null,
              on_leave: formData.onLeave || false,
              notes: formData.notes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (profileError) {
            console.warn('[useEmployeeCreation] Profile update warning:', profileError);
          }

          // Update role if specified and different from default
          if (formData.role && formData.role !== 'servicemedarbejder') {
            const { error: roleError } = await supabase
              .from('user_roles')
              .update({ role: formData.role })
              .eq('user_id', userId);
              
            if (roleError) {
              console.warn('[useEmployeeCreation] Role update warning:', roleError);
            }
          }
        }
        
        toast({
          title: t('employees.employeeAdded'),
          description: `${t('employees.employeeAddedMsg', { 
            name: formData.name, 
            role: formData.role || 'servicemedarbejder'
          })} (Method: ${method})`
        });
        
        await refreshEmployees();
        return true;
      }
      
      throw new Error('User creation failed - no valid result returned');
      
    } catch (err) {
      console.error('[useEmployeeCreation] Creation error:', err);
      
      let errorMessage = 'Failed to create employee';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Categorize errors for better user feedback
        if (errorMessage.includes('User already registered') || errorMessage.includes('email_address_already_registered')) {
          errorMessage = 'A user with this email already exists';
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address';
        } else if (errorMessage.includes('Password')) {
          errorMessage = 'Password does not meet requirements (8+ chars, uppercase, lowercase, number)';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to send a request')) {
          errorMessage = 'Network error: Unable to connect to server. Using fallback method failed.';
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
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
