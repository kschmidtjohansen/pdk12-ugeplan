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
import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

// Import refactored components
import UserTable from './UserTable';
import UserFormDialog from './UserFormDialog';
import UserDeleteDialog from './UserDeleteDialog';
import PasswordChangeDialog from './PasswordChangeDialog';
import UserStatusDialog from './UserStatusDialog';
import { AdminUser } from './UserTableRow';

// Define interface for Supabase auth user with banned_until property
interface SupabaseAuthUser {
  id: string;
  banned_until?: string | null;
  [key: string]: any;
}

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isActivating, setIsActivating] = useState(false);
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
      
      // Get auth user data to check banned_until status
      const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.warn('Could not fetch auth data:', authError);
      }
      
      // Combine the data
      const combinedUsers: AdminUser[] = profilesData.map(profile => {
        const userRole = rolesData.find(r => r.user_id === profile.id);
        // Find the auth user and safely access banned_until property
        const authUser = authResponse?.users?.find((user: SupabaseAuthUser) => user.id === profile.id);
        
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: (userRole?.role || 'servicemedarbejder') as UserRole,
          // Safely access banned_until from user metadata or app_metadata
          banned_until: authUser?.banned_until || null
        };
      });

      // Sort users by name alphabetically
      const sortedUsers = sortUsersByName(combinedUsers, sortDirection);
      setUsers(sortedUsers);
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
  
  // Function to sort users by name
  const sortUsersByName = (userList: AdminUser[], direction: 'asc' | 'desc'): AdminUser[] => {
    return [...userList].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      
      if (direction === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  };

  // Toggle sort direction and re-sort users
  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    setUsers(sortUsersByName(users, newDirection));
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

  const handleToggleUserStatus = (user: AdminUser) => {
    setCurrentUser(user);
    const isCurrentlyActive = !user.banned_until || new Date(user.banned_until) <= new Date();
    setIsActivating(!isCurrentlyActive);
    setStatusDialogOpen(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!currentUser) return;

    try {
      const isCurrentlyActive = !currentUser.banned_until || new Date(currentUser.banned_until) <= new Date();
      
      const { error } = await supabase.functions.invoke('admin-user-status', {
        body: { 
          userId: currentUser.id, 
          active: !isCurrentlyActive 
        }
      });
      
      if (error) throw error;
      
      toast({
        title: isCurrentlyActive 
          ? t('admin.userManagement.userDeactivated')
          : t('admin.userManagement.userActivated'),
        description: isCurrentlyActive 
          ? t('admin.userManagement.userDeactivatedMsg', { name: currentUser.name })
          : t('admin.userManagement.userActivatedMsg', { name: currentUser.name }),
      });
      
      // Refresh users list
      await fetchUsers();
      setStatusDialogOpen(false);
    } catch (err) {
      console.error('Error toggling user status:', err);
      toast({
        title: t('common.error'),
        description: isActivating 
          ? t('admin.userManagement.activateError')
          : t('admin.userManagement.deactivateError'),
        variant: 'destructive',
      });
    }
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
          sortUsersByName(
            users.map((u) =>
              u.id === currentUser.id ? { ...u, ...formData } : u
            ),
            sortDirection
          )
        );
        
        toast({
          title: t('admin.userManagement.userUpdated'),
          description: t('admin.userManagement.userUpdateMsg', { name: formData.name }),
        });
      } else {
        // Create new user via UserFormDialog which handles the creation
        // We need to update local state after successful creation
        const newUser: AdminUser = {
          id: Date.now().toString(), // Temporary ID, will be replaced with actual one
          ...formData
        };
        
        // Add user to the sorted list
        const updatedUsers = sortUsersByName([...users, newUser], sortDirection);
        setUsers(updatedUsers);
        
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
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortDirection}
                title={sortDirection === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
              >
                {sortDirection === 'asc' ? (
                  <ArrowDownAZ className="h-4 w-4" />
                ) : (
                  <ArrowUpAZ className="h-4 w-4" />
                )}
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="bg-polygon-blue hover:bg-polygon-darkblue"
              >
                {t('admin.userManagement.addUser')}
              </Button>
            </div>
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
              onToggleUserStatus={handleToggleUserStatus}
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

      {/* User Status Toggle Dialog */}
      <UserStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        user={currentUser}
        onConfirm={confirmToggleUserStatus}
        isActivating={isActivating}
      />
    </>
  );
};

export default UserManagement;
