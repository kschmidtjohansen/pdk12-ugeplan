
import React, { useState } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from '@/context/TranslationContext';
import { UserRole } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

interface UserFormDialogProps {
  currentUser: AdminUser | null;
  formData: {
    name: string;
    email: string;
    phone: string;
    jobTitle: string;
    role: UserRole;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRoleChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  currentUser,
  formData,
  handleInputChange,
  handleRoleChange,
  handleSubmit,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      console.log('[UserFormDialog] Starting form submission');
      
      if (!currentUser) {
        // Creating a new user - validate password
        if (!isPasswordValid) {
          setErrorMessage('Password must meet all requirements: at least 8 characters with uppercase, lowercase, and number');
          setIsSubmitting(false);
          return;
        }
        
        console.log('[UserFormDialog] Calling admin-create-user function');
        
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
          body: { 
            email: formData.email, 
            password: password,
            userData: {
              name: formData.name,
              phone: formData.phone,
              job_title: formData.jobTitle
            }
          }
        });
        
        if (error) {
          console.error('[UserFormDialog] Function error:', error);
          throw new Error(error.message || "Failed to create user");
        }
        
        if (data?.error) {
          console.error('[UserFormDialog] Function returned error:', data.error);
          throw new Error(data.error);
        }
        
        if (!data?.user) {
          console.error('[UserFormDialog] No user returned from function:', data);
          throw new Error("No user data returned from creation");
        }
        
        console.log('[UserFormDialog] User created successfully:', data.user.id);
        
        // Wait a brief moment for the user to be created and the trigger to run
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the user's role if it's not the default
        if (formData.role !== 'servicemedarbejder') {
          console.log('[UserFormDialog] Updating user role to:', formData.role);
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', data.user.id);
            
          if (roleError) {
            console.error('[UserFormDialog] Role update error:', roleError);
            throw new Error('User created but role update failed');
          }
        }

        // Update profile with additional fields
        console.log('[UserFormDialog] Updating profile with additional data');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone || null,
            job_title: formData.jobTitle || null,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.warn('[UserFormDialog] Profile update warning:', profileError);
          // Don't fail the entire operation for profile updates
        }
        
      } else {
        // This will be handled by the parent component's handleSubmit
        // which calls updateUserWithFallback
        console.log('[UserFormDialog] Updating existing user via parent handler');
      }
      
      // Call parent submit handler
      await handleSubmit(e);
      
    } catch (error) {
      console.error('[UserFormDialog] Error saving user:', error);
      
      let errorMsg = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      // Map common errors to user-friendly messages
      if (errorMsg.includes('User already registered')) {
        errorMsg = 'A user with this email already exists';
      } else if (errorMsg.includes('Invalid email')) {
        errorMsg = 'Please enter a valid email address';
      } else if (errorMsg.includes('Password')) {
        errorMsg = 'Password does not meet requirements';
      } else if (errorMsg.includes('rate limit')) {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        errorMsg = 'Network error. Please check your connection and try again.';
      } else if (errorMsg.includes('Failed to send a request')) {
        errorMsg = 'Unable to connect to server. Please check your connection and try again.';
      }
      
      setErrorMessage(errorMsg);
      
      toast({
        title: t('common.error'),
        description: errorMsg,
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
          {currentUser ? t('admin.userManagement.editUser') : t('admin.userManagement.addNewUser')}
        </DialogTitle>
        <DialogDescription>
          {currentUser 
            ? t('admin.userManagement.updateInfo') 
            : t('admin.userManagement.createAccount')}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleFormSubmit}>
        <div className="grid gap-4 py-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t('admin.userManagement.fullName')}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              {t('admin.userManagement.email')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="col-span-3"
              required
              disabled={!!currentUser} // Can't change email for existing users
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              {t('admin.userManagement.phone')}
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jobTitle" className="text-right">
              {t('admin.userManagement.position')}
            </Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              {t('admin.userManagement.role')}
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('admin.userManagement.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="administrator">{t('admin.roles.administrator')}</SelectItem>
                  <SelectItem value="skadeleder">{t('admin.roles.skadeleder')}</SelectItem>
                  <SelectItem value="servicemedarbejder">{t('admin.roles.servicemedarbejder')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {!currentUser && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="password" className="text-right pt-2">
                {t('common.password')}
              </Label>
              <div className="col-span-3">
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!currentUser}
                  autoComplete="new-password"
                  showStrengthIndicator={true}
                  onValidationChange={setIsPasswordValid}
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || (!currentUser && !isPasswordValid)}
          >
            {isSubmitting 
              ? t('common.loading') 
              : currentUser
                ? t('common.save')
                : t('common.create')
            }
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default UserFormDialog;
