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
import { User, UserRole } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface UserFormDialogProps {
  currentUser: (User & Partial<Employee>) | null;
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
  const [showPasswordFields, setShowPasswordFields] = useState(!currentUser);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { t } = useTranslation();
  const { register, updateUserRole } = useAuth();
  const { toast } = useToast();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!currentUser) {
        // Creating a new user
        if (password !== confirmPassword) {
          toast({
            title: t('common.error'),
            description: t('admin.passwords.passwordsMustMatch'),
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        if (password.length < 6) {
          toast({
            title: t('common.error'),
            description: t('admin.passwords.passwordTooShort'),
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Register the new user
        await register(formData.email, password, formData.name);
        
        // Wait a brief moment for the user to be created and the trigger to run
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch the newly created user to get their ID
        const { data: newUser, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Update the user's role if it's not the default
        if (formData.role !== 'servicemedarbejder') {
          await updateUserRole(newUser.id, formData.role);
        }
        
        // Update profile with additional details
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: formData.phone,
            job_title: formData.jobTitle
          })
          .eq('id', newUser.id);
          
        if (profileError) throw profileError;
      } else {
        // Updating an existing user
        // Update profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            phone: formData.phone,
            job_title: formData.jobTitle
          })
          .eq('id', currentUser.id);
          
        if (profileError) throw profileError;
        
        // Update role if changed
        await updateUserRole(currentUser.id, formData.role);
      }
      
      // Call original submit handler for UI updates
      handleSubmit(e);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: t('common.error'),
        description: currentUser 
          ? t('admin.userManagement.updateError') 
          : t('admin.userManagement.createError'),
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
              {t('employees.phone')}
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
              {t('employees.jobTitle')}
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
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  {t('common.password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  required={!currentUser}
                  autoComplete="new-password"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  {t('admin.passwords.confirmPassword')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="col-span-3"
                  required={!currentUser}
                  autoComplete="new-password"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? t('common.saving') 
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
