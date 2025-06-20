
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder' as UserRole,
  });

  // Fetch users using the edge function with improved error handling
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('[UserManagement] Fetching users via edge function');
      
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      
      if (error) {
        console.error('[UserManagement] Edge function error:', error);
        
        // Provide specific error messages
        let errorMessage = 'Failed to fetch users';
        if (error.message?.includes('Failed to send a request')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message?.includes('Not authenticated')) {
          errorMessage = 'Authentication expired. Please refresh the page and try again.';
        } else if (error.message?.includes('Unauthorized')) {
          errorMessage = 'You do not have permission to manage users.';
        }
        
        throw new Error(errorMessage);
      }
      
      if (data?.error) {
        console.error('[UserManagement] Function returned error:', data.error);
        throw new Error(data.error);
      }
      
      if (!data?.users) {
        console.error('[UserManagement] No users data returned:', data);
        throw new Error('No users data returned from server');
      }
      
      console.log('[UserManagement] Successfully fetched users:', data.users.length);
      
      // Sort users by name alphabetically
      const sortedUsers = sortUsersByName(data.users, sortDirection);
      setUsers(sortedUsers);
    } catch (err) {
      console.error('[UserManagement] Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Set empty array on error so UI doesn't break
      setUsers([]);
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

  // Set up realtime subscription for profile changes
  useEffect(() => {
    const channel = supabase
      .channel('profiles_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile change detected in admin:', payload.eventType);
          fetchUsers(); // Refresh user data when profiles change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      
      console.log('[UserManagement] Toggling user status:', {
        userId: currentUser.id,
        currentlyActive: isCurrentlyActive,
        newActive: !isCurrentlyActive
      });
      
      const { data, error } = await supabase.functions.invoke('admin-user-status', {
        body: { 
          userId: currentUser.id, 
          active: !isCurrentlyActive 
        }
      });
      
      if (error) {
        console.error('[UserManagement] Status toggle error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('[UserManagement] Function returned error:', data.error);
        throw new Error(data.error);
      }
      
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
      console.error('[UserManagement] Error toggling user status:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const confirmDeleteUser = async () => {
    if (!currentUser) return;

    try {
      setIsDeleting(true);
      console.log('[UserManagement] Starting user deletion for:', currentUser.id, 'Name:', currentUser.name);
      
      const { data, error } = await supabase.functions.invoke('admin-user-delete', {
        body: { userId: currentUser.id }
      });
      
      if (error) {
        console.error('[UserManagement] Edge function error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to delete user';
        
        if (error.message?.includes('Failed to send a request')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message?.includes('Not authenticated')) {
          errorMessage = 'Authentication expired. Please refresh the page and try again.';
        } else if (error.message?.includes('Unauthorized')) {
          errorMessage = 'You do not have permission to delete users.';
        } else if (error.message?.includes('non-2xx status code')) {
          errorMessage = 'Deletion failed. The user may have associated assignments or data that prevents deletion.';
        } else {
          errorMessage = error.message || 'Failed to delete user';
        }
        
        throw new Error(errorMessage);
      }
      
      if (data?.error) {
        console.error('[UserManagement] Deletion function returned error:', data.error);
        
        // Handle specific business logic errors
        if (data.error.includes('Cannot delete user: User is still assigned')) {
          throw new Error('Cannot delete user: This user is assigned as responsible for some assignments. Please reassign those assignments to another user first, or delete the assignments.');
        } else if (data.error.includes('Cannot delete user')) {
          throw new Error(data.error);
        }
        
        throw new Error(data.error);
      }
      
      console.log('[UserManagement] User deletion successful:', data);
      
      toast({
        title: t('admin.userManagement.userDeleted'),
        description: t('admin.userManagement.userDeletedMsg', { name: currentUser.name }),
      });
      
      setDeleteDialogOpen(false);
      setCurrentUser(null);
      
      // Refresh the user list
      await fetchUsers();
      
    } catch (err) {
      console.error('[UserManagement] Error deleting user:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
        // Update existing user - this will be handled by UserFormDialog
        console.log('[UserManagement] Updating existing user via UserFormDialog');
      } else {
        // Create new user - this will be handled by UserFormDialog
        console.log('[UserManagement] Creating new user via UserFormDialog');
      }
      
      // The UserFormDialog handles the actual creation/update
      // We just need to refresh the list after successful operation
      await fetchUsers();
      setUserDialogOpen(false);
    } catch (err) {
      console.error('[UserManagement] Error in handleSubmitUser:', err);
      // Error handling is done in UserFormDialog
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
                onClick={() => {
                  setCurrentUser(null);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    jobTitle: '',
                    role: 'servicemedarbejder',
                  });
                  setUserDialogOpen(true);
                }}
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
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found or failed to load users.</p>
              <Button 
                onClick={fetchUsers}
                variant="outline"
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : (
            <UserTable 
              users={users}
              onEditUser={(user) => {
                setCurrentUser(user);
                setFormData({
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '',
                  jobTitle: user.jobTitle || '',
                  role: user.role,
                });
                setUserDialogOpen(true);
              }}
              onDeleteUser={(user) => {
                setCurrentUser(user);
                setDeleteDialogOpen(true);
              }}
              onResetPassword={(user) => {
                setCurrentUser(user);
                setPasswordDialogOpen(true);
              }}
              onToggleUserStatus={(user) => {
                setCurrentUser(user);
                const isCurrentlyActive = !user.banned_until || new Date(user.banned_until) <= new Date();
                setIsActivating(!isCurrentlyActive);
                setStatusDialogOpen(true);
              }}
              getRoleLabel={(role) => t(`admin.roles.${role}`)}
              getInitials={(name) => name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2)}
            />
          )}
        </CardContent>
      </Card>

      {/* User Add/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <UserFormDialog 
          currentUser={currentUser}
          formData={formData}
          handleInputChange={(e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
          }}
          handleRoleChange={(value) => {
            setFormData(prev => ({ ...prev, role: value as UserRole }));
          }}
          handleSubmit={async (e) => {
            e.preventDefault();
            // The UserFormDialog handles the actual creation/update
            await fetchUsers();
            setUserDialogOpen(false);
          }}
          onClose={() => setUserDialogOpen(false)}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <UserDeleteDialog 
          currentUser={currentUser}
          onConfirmDelete={confirmDeleteUser}
          isDeleting={isDeleting}
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
        onConfirm={async () => {
          if (!currentUser) return;

          try {
            const isCurrentlyActive = !currentUser.banned_until || new Date(currentUser.banned_until) <= new Date();
            
            console.log('[UserManagement] Toggling user status:', {
              userId: currentUser.id,
              currentlyActive: isCurrentlyActive,
              newActive: !isCurrentlyActive
            });
            
            const { data, error } = await supabase.functions.invoke('admin-user-status', {
              body: { 
                userId: currentUser.id, 
                active: !isCurrentlyActive 
              }
            });
            
            if (error) {
              console.error('[UserManagement] Status toggle error:', error);
              throw error;
            }
            
            if (data?.error) {
              console.error('[UserManagement] Function returned error:', data.error);
              throw new Error(data.error);
            }
            
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
            console.error('[UserManagement] Error toggling user status:', err);
            
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            toast({
              title: t('common.error'),
              description: errorMessage,
              variant: 'destructive',
            });
          }
        }}
        isActivating={isActivating}
      />
    </>
  );
};

export default UserManagement;
