
import React, { useState } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { PasswordInput } from '@/components/ui/password-input';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  jobTitle?: string;
}

interface PasswordChangeDialogProps {
  currentUser: AdminUser | null;
  onClose: () => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  currentUser,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const { adminResetPassword, validateAdminAccess, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const validateForm = () => {
    console.log('[PasswordChangeDialog] Validating form...');
    
    if (!isPasswordValid) {
      console.log('[PasswordChangeDialog] Password validation failed');
      toast({
        title: t('common.error'),
        description: 'Password must be at least 8 characters long and contain uppercase, lowercase, and number',
        variant: "destructive",
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      console.log('[PasswordChangeDialog] Password confirmation failed');
      toast({
        title: t('common.error'),
        description: t('admin.passwords.passwordsMustMatch'),
        variant: "destructive",
      });
      return false;
    }

    console.log('[PasswordChangeDialog] Form validation passed');
    return true;
  };

  const testEdgeFunctionConnectivity = async () => {
    try {
      console.log('[PasswordChangeDialog] Testing edge function connectivity...');
      
      // Test with a simple OPTIONS request first
      const response = await fetch(`https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/admin-reset-password`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
        }
      });
      
      console.log('[PasswordChangeDialog] OPTIONS response status:', response.status);
      console.log('[PasswordChangeDialog] OPTIONS response headers:', Object.fromEntries(response.headers.entries()));
      
      return response.ok;
    } catch (error) {
      console.error('[PasswordChangeDialog] Edge function connectivity test failed:', error);
      return false;
    }
  };

  const validateAuthenticationToken = async () => {
    try {
      console.log('[PasswordChangeDialog] Validating authentication token...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[PasswordChangeDialog] Session error:', error);
        return null;
      }
      
      if (!session || !session.access_token) {
        console.error('[PasswordChangeDialog] No valid session or access token');
        return null;
      }
      
      console.log('[PasswordChangeDialog] Valid session found, expires at:', new Date(session.expires_at * 1000));
      console.log('[PasswordChangeDialog] Token length:', session.access_token.length);
      
      // Check if token is close to expiry
      const expiryTime = session.expires_at * 1000;
      const currentTime = Date.now();
      const timeToExpiry = expiryTime - currentTime;
      
      if (timeToExpiry < 60000) { // Less than 1 minute
        console.warn('[PasswordChangeDialog] Token expires soon, attempting refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('[PasswordChangeDialog] Token refresh failed:', refreshError);
          return null;
        }
        console.log('[PasswordChangeDialog] Token refreshed successfully');
        
        // Get the new session
        const { data: { session: newSession } } = await supabase.auth.getSession();
        return newSession?.access_token || null;
      }
      
      return session.access_token;
    } catch (error) {
      console.error('[PasswordChangeDialog] Token validation error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !validateForm()) return;
    
    console.log('[PasswordChangeDialog] Starting password reset process for user:', currentUser.id);
    console.log('[PasswordChangeDialog] Current user role:', user?.role);
    console.log('[PasswordChangeDialog] Current admin user:', user);
    
    // Validate admin access first
    if (!validateAdminAccess()) {
      console.error('[PasswordChangeDialog] Admin access validation failed');
      return;
    }
    console.log('[PasswordChangeDialog] Admin access validated');
    
    setIsSubmitting(true);

    try {
      // Step 1: Test edge function connectivity
      console.log('[PasswordChangeDialog] Step 1: Testing edge function connectivity...');
      const isConnected = await testEdgeFunctionConnectivity();
      if (!isConnected) {
        throw new Error('Edge function is not accessible. Please check if the function is deployed.');
      }
      console.log('[PasswordChangeDialog] Edge function connectivity test passed');

      // Step 2: Validate authentication token
      console.log('[PasswordChangeDialog] Step 2: Validating authentication token...');
      const accessToken = await validateAuthenticationToken();
      if (!accessToken) {
        throw new Error('Authentication token is invalid or expired. Please refresh the page and try again.');
      }
      console.log('[PasswordChangeDialog] Authentication token validated');

      // Step 3: Make the password reset request
      console.log('[PasswordChangeDialog] Step 3: Making password reset request...');
      console.log('[PasswordChangeDialog] Request payload:', {
        userId: currentUser.id,
        passwordLength: newPassword.length
      });
      
      const requestHeaders = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      };
      
      console.log('[PasswordChangeDialog] Request headers:', requestHeaders);
      
      // Use supabase.functions.invoke for the actual request
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { 
          userId: currentUser.id, 
          newPassword: newPassword
        }
      });
      
      console.log('[PasswordChangeDialog] Supabase function response:', { data, error });
      
      if (error) {
        console.error('[PasswordChangeDialog] Password reset failed:', error);
        
        // Enhanced error handling with more specific messages
        let errorMessage = t('admin.passwords.resetError');
        
        if (error.message?.includes('Failed to send a request')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message?.includes('Origin not allowed')) {
          errorMessage = 'Access denied: Origin not allowed. Please check your connection.';
        } else if (error.message?.includes('Rate limit exceeded')) {
          errorMessage = 'Too many requests. Please wait before trying again.';
        } else if (error.message?.includes('Missing or invalid authorization')) {
          errorMessage = 'Your session has expired. Please refresh the page and try again.';
        } else if (error.message?.includes('Invalid authentication token')) {
          errorMessage = 'Authentication failed. Please log out and log back in.';
        } else if (error.message?.includes('Insufficient privileges')) {
          errorMessage = 'You do not have permission to reset passwords.';
        } else if (error.message?.includes('Invalid user ID format')) {
          errorMessage = 'Invalid user selected. Please try selecting the user again.';
        } else if (error.message?.includes('Password must')) {
          errorMessage = error.message; // Use the specific password validation error
        } else if (error.message?.includes('Password reset failed:')) {
          errorMessage = error.message; // Use the specific Supabase error
        } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      console.log('[PasswordChangeDialog] Password reset successful');
      
      toast({
        title: t('admin.passwords.resetSuccess'),
        description: t('admin.passwords.resetDescription', { name: currentUser.name }),
      });
      
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('[PasswordChangeDialog] Unexpected error:', error);
      
      // More specific error handling for different error types
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {currentUser && t('admin.passwords.resetPasswordFor', { name: currentUser.name })}
        </DialogTitle>
        <DialogDescription>
          {t('admin.passwords.enterNewPassword')}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <PasswordInput
              label={t('admin.passwords.newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showStrengthIndicator={true}
              onValidationChange={setIsPasswordValid}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t('admin.passwords.confirmPassword')}
            </Label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || !isPasswordValid}>
            {isSubmitting ? t('admin.passwords.resetting') : t('admin.passwords.resetPassword')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default PasswordChangeDialog;
