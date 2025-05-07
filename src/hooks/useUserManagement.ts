
import { useState, useEffect } from 'react';
import { useToast } from '../components/ui/use-toast';
import { useTranslation } from '../context/TranslationContext';
import { authService } from '../services/authService';
import type { User } from '../types/auth';
import type { UserRole } from '../types/auth';

// User form data type
export interface UserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder'
  });
  
  const { toast } = useToast();
  const { t } = useTranslation();

  // Helper function to get role label
  const getRoleLabel = (role: UserRole): string => {
    return t(`admin.roles.${role}`);
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // Fetch all users from the database
        const { data: usersData, error } = await authService.listUsers();
        
        if (error) throw error;
        
        if (usersData) {
          // Convert to proper User type
          const typedUsers = usersData.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
            phone: user.phone || '',
            jobTitle: user.job_title || ''
          }));
          setUsers(typedUsers);
        }
      } catch (error) {
        console.error('Failed to load users', error);
        toast({
          variant: 'destructive',
          title: t('admin.errorLoadingUsers'),
          description: t('admin.errorGeneric')
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [toast, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentUser) {
        // Update existing user
        const updatedUser = await authService.updateUser(currentUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          jobTitle: formData.jobTitle,
          // Only include password if it was actually entered
          ...(formData.password ? { password: formData.password } : {})
        });
        
        if (updatedUser) {
          // Update local state
          setUsers(users.map(u => u.id === currentUser.id ? {
            ...u,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone,
            jobTitle: formData.jobTitle
          } : u));
          
          toast({
            title: t('admin.userUpdated'),
            description: t('admin.userUpdateMsg', { name: formData.name })
          });
        }
      } else {
        // Create new user
        if (!formData.password) {
          toast({
            variant: 'destructive',
            title: t('admin.errorCreatingUser'),
            description: 'Password is required for new users'
          });
          return;
        }
        
        const newUser = await authService.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          jobTitle: formData.jobTitle
        });
        
        if (newUser) {
          // Add to local state
          setUsers([...users, newUser as User]);
          
          toast({
            title: t('admin.userAdded'),
            description: t('admin.userAddedMsg', { 
              name: formData.name, 
              role: getRoleLabel(formData.role) 
            })
          });
        }
      }
      
      // Close the dialog
      setFormDialogOpen(false);
    } catch (error) {
      console.error('Error submitting user form', error);
      toast({
        variant: 'destructive',
        title: currentUser ? t('admin.errorUpdatingUser') : t('admin.errorCreatingUser'),
        description: error instanceof Error ? error.message : t('admin.errorGeneric')
      });
    }
  };

  const handleAddNewUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder'
    });
    setFormDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      jobTitle: user.jobTitle || '',
      role: user.role
    });
    setFormDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setCurrentUser(user);
    setPasswordDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      await authService.deleteUser(currentUser.id);
      
      // Update local state
      setUsers(users.filter(u => u.id !== currentUser.id));
      
      toast({
        title: t('admin.userDeleted'),
        description: t('admin.userDeletedMsg', { name: currentUser.name })
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting user', error);
      toast({
        variant: 'destructive',
        title: t('admin.errorDeletingUser'),
        description: t('admin.errorGeneric')
      });
    }
  };

  const confirmPasswordChange = async (password: string) => {
    if (!currentUser) return;
    
    try {
      await authService.resetUserPassword(currentUser.id, password);
      
      toast({
        title: t('admin.passwordChanged'),
        description: t('admin.passwordChangedDesc', { name: currentUser.name })
      });
      
      setPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error changing password', error);
      toast({
        variant: 'destructive',
        title: t('admin.errorChangingPassword'),
        description: t('admin.errorGeneric')
      });
    }
  };

  return {
    users,
    loading,
    formDialogOpen,
    setFormDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    passwordDialogOpen,
    setPasswordDialogOpen,
    currentUser,
    formData,
    handleInputChange,
    handleRoleChange,
    handleSubmit,
    handleAddNewUser,
    handleEditUser,
    handleDeleteUser,
    handleResetPassword,
    confirmDeleteUser,
    confirmPasswordChange,
    getRoleLabel,
    getInitials
  };
};
