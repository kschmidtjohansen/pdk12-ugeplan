
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

// Import refactored components
import UserTable from './UserTable';
import UserFormDialog from './UserFormDialog';
import UserDeleteDialog from './UserDeleteDialog';
import PasswordChangeDialog from './PasswordChangeDialog';
import { AdminUser } from './UserTableRow';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder' as UserRole,
  });

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title
        `);
      
      if (profilesError) throw profilesError;
      
      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
        
      if (rolesError) throw rolesError;
      
      // Combine the data
      const combinedUsers: AdminUser[] = profilesData.map(profile => {
        const userRole = rolesData.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: (userRole?.role || 'servicemedarbejder') as UserRole
        };
      });
      
      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: t('common.error'),
        description: t('admin.userManagement.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleCreateUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder',
    });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      jobTitle: user.jobTitle || '',
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: AdminUser) => {
    setCurrentUser(user);
    setPasswordDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (currentUser) {
      try {
        // Use Supabase edge function to delete user
        const { error } = await supabase.functions.invoke('admin-user-delete', {
          body: { userId: currentUser.id }
        });
        
        if (error) throw error;
        
        setUsers(users.filter(user => user.id !== currentUser.id));
        
        toast({
          title: t('admin.userManagement.userDeleted'),
          description: t('admin.userManagement.userDeletedMsg', { name: currentUser.name }),
        });
        
        setDeleteDialogOpen(false);
      } catch (err) {
        console.error('Error deleting user:', err);
        toast({
          title: t('common.error'),
          description: t('admin.userManagement.deleteError'),
          variant: 'destructive',
        });
      }
    }
  };

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

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentUser) {
        // Update existing user
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
        if (currentUser.role !== formData.role) {
          const { error: roleError } = await supabase.functions.invoke('admin-user-role', {
            body: { userId: currentUser.id, role: formData.role }
          });
          
          if (roleError) throw roleError;
        }
        
        // Update local state
        setUsers(
          users.map((u) =>
            u.id === currentUser.id ? { ...u, ...formData } : u
          )
        );
        
        toast({
          title: t('admin.userManagement.userUpdated'),
          description: t('admin.userManagement.userUpdateMsg', { name: formData.name }),
        });
      } else {
        // Create new user via UserFormDialog which handles the creation
        // We just need to update local state after successful creation
        const newUser: AdminUser = {
          id: Date.now().toString(), // Temporary ID, will be replaced with actual one
          ...formData
        };
        
        setUsers([...users, newUser]);
        
        toast({
          title: t('admin.userManagement.userAdded'),
          description: t('admin.userManagement.userAddedMsg', {
            name: formData.name, 
            role: getRoleLabel(formData.role)
          }),
        });
        
        // Refresh users list to get the actual data from the database
        fetchUsers();
      }
      
      setUserDialogOpen(false);
    } catch (err) {
      console.error('Error saving user:', err);
      toast({
        title: t('common.error'),
        description: currentUser ? t('admin.userManagement.updateError') : t('admin.userManagement.createError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.userManagement.title')}</CardTitle>
              <CardDescription>{t('admin.userManagement.description')}</CardDescription>
            </div>
            <Button 
              onClick={handleCreateUser}
              className="bg-polygon-blue hover:bg-polygon-darkblue"
            >
              {t('admin.userManagement.addUser')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-polygon-blue"></div>
            </div>
          ) : (
            <UserTable 
              users={users}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleResetPassword}
              getRoleLabel={getRoleLabel}
              getInitials={getInitials}
            />
          )}
        </CardContent>
      </Card>

      {/* User Add/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <UserFormDialog 
          currentUser={currentUser}
          formData={formData}
          handleInputChange={handleInputChange}
          handleRoleChange={handleRoleChange}
          handleSubmit={handleSubmitUser}
          onClose={() => setUserDialogOpen(false)}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <UserDeleteDialog 
          currentUser={currentUser}
          onConfirmDelete={confirmDeleteUser}
        />
      </AlertDialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <PasswordChangeDialog
          currentUser={currentUser}
          onClose={() => setPasswordDialogOpen(false)}
        />
      </Dialog>
    </>
  );
};

export default UserManagement;
