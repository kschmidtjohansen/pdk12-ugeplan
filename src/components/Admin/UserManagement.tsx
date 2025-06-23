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
import { ArrowDownAZ, ArrowUpAZ, RefreshCw, AlertCircle, Wifi, WifiOff, Bug, Database } from 'lucide-react';

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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'fallback'>('connected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  
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
    setDebugInfo(prev => [`[${timestamp}] ${info}`, ...prev.slice(0, 19)]);
    console.log(`[UserManagement Debug] ${info}`);
  };

  // Enhanced edge function testing with different methods
  const testEdgeFunction = async (): Promise<any> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('No valid session');
    }

    addDebugInfo(`Testing edge function with token length: ${session.access_token.length}`);

    // Try method 1: Standard invoke with GET
    try {
      addDebugInfo('Method 1: Using supabase.functions.invoke with GET');
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      addDebugInfo(`Method 1 SUCCESS: Got ${data?.users?.length || 0} users`);
      return data;
    } catch (err) {
      addDebugInfo(`Method 1 FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Try method 2: Direct fetch call
    try {
      addDebugInfo('Method 2: Using direct fetch call');
      const response = await fetch(`https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/admin-list-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dXlycHd0a2xqZmlxd2dhc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3Njg5ODEsImV4cCI6MjA2MjM0NDk4MX0.j6NYT5jwYaYhZYVsRqW20T6_I9WkcqSmZ-rHyA78k5U',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data?.error) throw new Error(data.error);
      
      addDebugInfo(`Method 2 SUCCESS: Got ${data?.users?.length || 0} users`);
      return data;
    } catch (err) {
      addDebugInfo(`Method 2 FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Try method 3: POST with body
    try {
      addDebugInfo('Method 3: Using POST with empty body');
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {}
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      addDebugInfo(`Method 3 SUCCESS: Got ${data?.users?.length || 0} users`);
      return data;
    } catch (err) {
      addDebugInfo(`Method 3 FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    throw new Error('All edge function methods failed');
  };

  // Enhanced fallback using direct database queries
  const fetchUsersDirectly = async () => {
    try {
      setUsingFallback(true);
      addDebugInfo('FALLBACK: Using direct database queries');
      
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
        addDebugInfo(`FALLBACK profiles error: ${profilesError.message}`);
        throw profilesError;
      }

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        addDebugInfo(`FALLBACK roles warning: ${rolesError.message}`);
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

      addDebugInfo(`FALLBACK SUCCESS: Loaded ${combinedUsers.length} users`);
      return { users: combinedUsers, total: combinedUsers.length };

    } catch (err) {
      addDebugInfo(`FALLBACK FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  // Main user fetching with comprehensive error handling
  const fetchUsers = async (isRetry = false) => {
    try {
      setLoading(true);
      setLastError(null);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
        addDebugInfo(`Retry attempt: ${retryCount + 1}`);
      } else {
        addDebugInfo('Starting fresh user fetch');
        setRetryCount(0);
        setUsingFallback(false);
      }
      
      let data;
      
      // Try edge function first (unless we're already using fallback)
      if (!usingFallback) {
        try {
          data = await testEdgeFunction();
          setConnectionStatus('connected');
        } catch (err) {
          addDebugInfo(`Edge function failed, switching to fallback: ${err instanceof Error ? err.message : 'Unknown error'}`);
          data = await fetchUsersDirectly();
          setConnectionStatus('fallback');
        }
      } else {
        // Use fallback directly
        data = await fetchUsersDirectly();
        setConnectionStatus('fallback');
      }
      
      if (!data?.users) {
        throw new Error('No users data returned');
      }
      
      // Sort users by name
      const sortedUsers = sortUsersByName(data.users, sortDirection);
      setUsers(sortedUsers);
      
      addDebugInfo(`Successfully loaded ${data.users.length} users`);
      
      // Show success message if this was a retry
      if (isRetry && retryCount > 0) {
        toast({
          title: 'Success',
          description: `Successfully loaded ${data.users.length} users${usingFallback ? ' (using database fallback)' : ''}`,
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

  // Smart retry that can switch methods
  const handleSmartRetry = async () => {
    addDebugInfo('Starting smart retry...');
    await fetchUsers(true);
  };

  // Force fallback mode
  const handleForceFallback = async () => {
    addDebugInfo('Forcing fallback mode...');
    setUsingFallback(true);
    await fetchUsers(true);
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
        case 'fallback': return 'text-blue-600';
        case 'disconnected': return 'text-orange-600';
        case 'error': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusIcon = () => {
      switch (connectionStatus) {
        case 'connected': return <Wifi className="h-4 w-4" />;
        case 'fallback': return <Database className="h-4 w-4" />;
        case 'disconnected': return <WifiOff className="h-4 w-4" />;
        case 'error': return <AlertCircle className="h-4 w-4" />;
        default: return <Wifi className="h-4 w-4" />;
      }
    };

    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected': return 'Edge Function Active';
        case 'fallback': return 'Database Fallback';
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

  // Enhanced debug info panel
  const DebugPanel = () => {
    if (debugInfo.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2 mb-2">
          <Bug className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Debug Info ({debugInfo.length})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDebugInfo([])}
            className="ml-auto h-6 px-2 text-xs"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSmartRetry}
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceFallback}
            className="h-6 px-2 text-xs"
          >
            Force Fallback
          </Button>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
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
                  onClick={handleForceFallback}
                  variant="outline"
                >
                  Use Fallback
                </Button>
                <Button 
                  onClick={handleCreateUser}
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
                  Showing {users.length} users {usingFallback && '(via fallback)'}
                </div>
                {retryCount > 0 && (
                  <div className="text-xs text-orange-600">
                    Retry attempts: {retryCount}
                  </div>
                )}
              </div>
              <UserTable 
                users={users}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onResetPassword={handleResetPassword}
                onToggleUserStatus={handleToggleUserStatus}
                getRoleLabel={getRoleLabel}
                getInitials={getInitials}
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
