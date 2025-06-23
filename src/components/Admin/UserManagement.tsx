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
import { ArrowDownAZ, ArrowUpAZ, RefreshCw, AlertCircle, Wifi, WifiOff, Bug } from 'lucide-react';

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
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Dialog state
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

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    setDebugInfo(prev => [`[${timestamp}] ${info}`, ...prev.slice(0, 9)]);
    console.log(`[UserManagement Debug] ${info}`);
  };

  // Enhanced user fetching with comprehensive debugging
  const fetchUsers = async (isRetry = false) => {
    try {
      setLoading(true);
      setLastError(null);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
        addDebugInfo(`Retry attempt: ${retryCount + 1}`);
      } else {
        addDebugInfo('Starting fresh user fetch');
      }
      
      // Get current session with detailed logging
      addDebugInfo('Checking authentication session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addDebugInfo(`Session error: ${sessionError.message}`);
        throw new Error('Authentication session error: ' + sessionError.message);
      }
      
      if (!session?.access_token) {
        addDebugInfo('No valid session found');
        throw new Error('No valid authentication session. Please refresh and login again.');
      }

      addDebugInfo(`Session valid, token length: ${session.access_token.length}`);
      setConnectionStatus('connected');
      
      // Call the edge function with detailed logging
      addDebugInfo('Calling admin-list-users edge function...');
      
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (error) {
        addDebugInfo(`Edge function error: ${error.message}`);
        setConnectionStatus('error');
        
        // Provide specific error messages based on error type
        let errorMessage = 'Failed to fetch users';
        
        if (error.message?.includes('Failed to send a request') || 
            error.message?.includes('fetch') || 
            error.message?.includes('NetworkError')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
          setConnectionStatus('disconnected');
          addDebugInfo('Network error detected');
        } else if (error.message?.includes('Not authenticated') || 
                   error.message?.includes('Invalid token') || 
                   error.message?.includes('Authentication failed')) {
          errorMessage = 'Authentication expired. Please refresh the page and login again.';
          addDebugInfo('Authentication error detected');
        } else if (error.message?.includes('Unauthorized') || 
                   error.message?.includes('Administrator access required')) {
          errorMessage = 'You do not have permission to manage users. Administrator access is required.';
          addDebugInfo('Authorization error detected');
        } else if (error.message?.includes('Server configuration error')) {
          errorMessage = 'Server configuration issue. Please contact support.';
          addDebugInfo('Server configuration error detected');
        } else {
          errorMessage = `Server error: ${error.message}`;
          addDebugInfo(`Unknown server error: ${error.message}`);
        }
        
        throw new Error(errorMessage);
      }
      
      if (data?.error) {
        addDebugInfo(`Function returned error: ${data.error}`);
        setConnectionStatus('error');
        throw new Error(data.error);
      }
      
      if (!data?.users) {
        addDebugInfo('No users data returned from function');
        throw new Error('No users data returned from server. Please try again.');
      }
      
      addDebugInfo(`Successfully fetched ${data.users.length} users`);
      
      // Sort users by name
      const sortedUsers = sortUsersByName(data.users, sortDirection);
      setUsers(sortedUsers);
      setRetryCount(0); // Reset retry count on success
      setConnectionStatus('connected');
      
      // Show success message if this was a retry
      if (isRetry && retryCount > 0) {
        toast({
          title: 'Success',
          description: `Successfully loaded ${data.users.length} users`,
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching users';
      addDebugInfo(`Fetch failed: ${errorMessage}`);
      
      setLastError(errorMessage);
      setConnectionStatus('error');
      
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

  // Fallback user fetching using direct database queries
  const fetchUsersDirectly = async () => {
    try {
      setLoading(true);
      addDebugInfo('Attempting direct database fetch as fallback...');
      
      // Get profiles directly
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title,
          on_leave,
          notes,
          created_at,
          updated_at
        `);

      if (profilesError) {
        throw profilesError;
      }

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.warn('[UserManagement] Could not fetch roles:', rolesError);
      }

      // Combine data
      const combinedUsers = profiles?.map(profile => {
        const roleData = userRoles?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          jobTitle: profile.job_title,
          role: roleData?.role || 'servicemedarbejder' as UserRole,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_sign_in_at: null,
          banned_until: null,
          onLeave: profile.on_leave || false,
          notes: profile.notes
        };
      }) || [];

      setUsers(sortUsersByName(combinedUsers, sortDirection));
      setConnectionStatus('connected');
      
      toast({
        title: 'Partial Success',
        description: `Loaded ${combinedUsers.length} users (limited data available)`,
      });

    } catch (err) {
      addDebugInfo(`Direct fetch also failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
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

  // Retry with exponential backoff
  const handleRetry = async () => {
    if (retryCount < 3) {
      await fetchUsers(true);
    } else {
      // After 3 retries, try direct database approach
      try {
        await fetchUsersDirectly();
      } catch (err) {
        console.error('[UserManagement] All retry attempts failed:', err);
        setLastError('All attempts to fetch users failed. Please contact support.');
      }
    }
  };

  // Smart retry that attempts different approaches
  const handleSmartRetry = async () => {
    addDebugInfo('Starting smart retry...');
    
    if (retryCount < 2) {
      // First two attempts: try edge function
      await fetchUsers(true);
    } else {
      // After 2 edge function retries, try direct database access
      try {
        await fetchUsersDirectly();
        toast({
          title: 'Fallback Mode',
          description: 'Using direct database access. Some features may be limited.',
        });
      } catch (err) {
        setLastError('Unable to fetch users. Please check your connection and try again.');
      }
    }
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
    await fetchUsers();
    setUserDialogOpen(false);
  };

  // Connection status indicator
  const ConnectionStatusIndicator = () => {
    const getStatusColor = () => {
      switch (connectionStatus) {
        case 'connected': return 'text-green-600';
        case 'disconnected': return 'text-orange-600';
        case 'error': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusIcon = () => {
      switch (connectionStatus) {
        case 'connected': return <Wifi className="h-4 w-4" />;
        case 'disconnected': return <WifiOff className="h-4 w-4" />;
        case 'error': return <AlertCircle className="h-4 w-4" />;
        default: return <Wifi className="h-4 w-4" />;
      }
    };

    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected': return 'Connected';
        case 'disconnected': return 'Connection Issues';
        case 'error': return 'Error';
        default: return 'Unknown';
      }
    };

    return (
      <div className={`flex items-center space-x-2 text-sm ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  };

  // Debug info panel
  const DebugPanel = () => {
    if (debugInfo.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2 mb-2">
          <Bug className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Debug Info</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDebugInfo([])}
            className="ml-auto h-6 px-2 text-xs"
          >
            Clear
          </Button>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {debugInfo.map((info, index) => (
            <div key={index} className="text-xs text-gray-600 font-mono">
              {info}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{t('admin.userManagement.title')}</span>
                <ConnectionStatusIndicator />
              </CardTitle>
              <CardDescription>{t('admin.userManagement.description')}</CardDescription>
              {lastError && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{lastError}</span>
                  </div>
                </div>
              )}
              <DebugPanel />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSmartRetry}
                title="Refresh users list"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
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
            <div className="flex flex-col justify-center items-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-polygon-blue"></div>
              <p className="text-sm text-gray-500">
                {retryCount > 0 ? `Retrying... (attempt ${retryCount + 1})` : 'Loading users...'}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-500 mb-2">
                  {lastError 
                    ? 'Failed to load users due to connection issues.' 
                    : 'No users found or failed to load users.'
                  }
                </p>
                {lastError && (
                  <p className="text-sm text-red-600 mb-4">{lastError}</p>
                )}
              </div>
              <div className="space-x-2">
                <Button 
                  onClick={handleSmartRetry}
                  variant="outline"
                >
                  Try Again
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
                  Add First User
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {users.length} users
                </div>
                {retryCount > 0 && (
                  <div className="text-xs text-orange-600">
                    Retry attempts: {retryCount}
                  </div>
                )}
              </div>
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
            </div>
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
            
            const { data, error } = await supabase.functions.invoke('admin-user-status', {
              body: { 
                userId: currentUser.id, 
                active: !isCurrentlyActive 
              }
            });
            
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            
            toast({
              title: isCurrentlyActive 
                ? t('admin.userManagement.userDeactivated')
                : t('admin.userManagement.userActivated'),
              description: isCurrentlyActive 
                ? t('admin.userManagement.userDeactivatedMsg', { name: currentUser.name })
                : t('admin.userManagement.userActivatedMsg', { name: currentUser.name }),
            });
            
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
