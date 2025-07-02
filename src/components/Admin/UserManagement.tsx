
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

  // Enhanced fallback using direct database queries optimized for the new role structure
  const fetchUsersDirectly = async () => {
    try {
      setUsingFallback(true);
      addDebugInfo('ROLE UPDATE: Using direct database queries with enhanced role structure');
      
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

      // Get user roles - should now include 7 eligible users
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        addDebugInfo(`FALLBACK roles warning: ${rolesError.message}`);
      }

      // Enhanced data combination with role statistics
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

      // Enhanced statistics for the new role structure
      const roleCounts = combinedUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<UserRole, number>);

      addDebugInfo(`ROLE UPDATE SUCCESS: Loaded ${combinedUsers.length} users`);
      addDebugInfo(`Role distribution - Admin: ${roleCounts.administrator || 0}, Skadeleder: ${roleCounts.skadeleder || 0}, Service: ${roleCounts.servicemedarbejder || 0}`);
      addDebugInfo(`Expected 7 eligible users (3 admin + 4 skadeledere), found ${(roleCounts.administrator || 0) + (roleCounts.skadeleder || 0)}`);
      
      return { users: combinedUsers, total: combinedUsers.length };

    } catch (err) {
      addDebugInfo(`FALLBACK FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
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

    throw new Error('All edge function methods failed');
  };

  // Main user fetching with comprehensive error handling
  const fetchUsers = async (isRetry = false) => {
    try {
      setLoading(true);
      setLastError(null);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
        addDebugInfo(`ROLE UPDATE - Retry attempt: ${retryCount + 1}`);
      } else {
        addDebugInfo('ROLE UPDATE - Starting fresh user fetch with new role structure');
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
      
      addDebugInfo(`Successfully loaded ${data.users.length} users with updated role structure`);
      
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

  // Create user with fallback
  const createUserWithFallback = async (userData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    addDebugInfo('Attempting to create user...');

    // Try edge function first
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: userData
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      addDebugInfo('User created via edge function');
      return data;
    } catch (err) {
      addDebugInfo(`Edge function create failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Fallback: Manual user creation (this requires admin privileges)
      throw new Error('User creation via edge function failed. Please try again or contact support.');
    }
  };

  const updateUserWithFallback = async (userId: string, updates: any) => {
    addDebugInfo(`Updating user ${userId}...`);

    try {
      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          job_title: updates.jobTitle
        })
        .eq('id', userId);
        
      if (profileError) throw profileError;

      // Update role if provided
      if (updates.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: updates.role })
          .eq('user_id', userId);
          
        if (roleError) throw roleError;
      }

      addDebugInfo('User updated successfully');
      return { success: true };
    } catch (err) {
      addDebugInfo(`User update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  const deleteUserWithFallback = async (userId: string) => {
    addDebugInfo(`Deleting user ${userId}...`);

    // Try edge function first
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-delete', {
        body: { userId }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      addDebugInfo('User deleted via edge function');
      return data;
    } catch (err) {
      addDebugInfo(`Edge function delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Fallback: Manual deletion
      try {
        // Delete from profiles first (this will cascade due to foreign keys)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
          
        if (profileError) throw profileError;

        addDebugInfo('User deleted via fallback method');
        return { success: true };
      } catch (fallbackErr) {
        addDebugInfo(`Fallback delete failed: ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}`);
        throw new Error('User deletion failed. The user may have associated data that prevents deletion.');
      }
    }
  };

  const toggleUserStatusWithFallback = async (userId: string, active: boolean) => {
    addDebugInfo(`Toggling user ${userId} status to ${active ? 'active' : 'inactive'}...`);

    // Try edge function first
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-status', {
        body: { userId, active }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      addDebugInfo('User status toggled via edge function');
      return data;
    } catch (err) {
      addDebugInfo(`Edge function status toggle failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw new Error('User status toggle failed. This requires admin authentication access.');
    }
  };
  
  // Function to sort users by name
  const sortUsersByName = (userList: AdminUser[], direction: 'asc' | 'desc'): AdminUser[] => {
    return [...userList].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      
      if (direction === 'asc') {
        return nameA.localeComparison(nameB);
      } else {
        return nameB.localeComparison(nameA);
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
      
      await toggleUserStatusWithFallback(currentUser.id, !isCurrentlyActive);
      
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
      
      await deleteUserWithFallback(currentUser.id);
      
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
      if (!currentUser) {
        // Creating new user
        await createUserWithFallback({
          email: formData.email,
          password: '', // This will be handled by the form dialog
          userData: {
            name: formData.name,
            phone: formData.phone,
            job_title: formData.jobTitle,
            role: formData.role
          }
        });
      } else {
        // Updating existing user
        await updateUserWithFallback(currentUser.id, formData);
      }
      
      await fetchUsers();
      setUserDialogOpen(false);
      
      toast({
        title: t('common.success'),
        description: currentUser 
          ? t('admin.userManagement.updateSuccess') 
          : t('admin.userManagement.createSuccess'),
      });
      
    } catch (err) {
      console.error('[UserManagement] Error saving user:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
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

  // Enhanced debug info panel with role structure context
  const DebugPanel = () => {
    if (debugInfo.length === 0) return null;
    
    // Calculate role statistics from current users
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    const eligibleUsers = (roleCounts.administrator || 0) + (roleCounts.skadeleder || 0);
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2 mb-2">
          <Bug className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Debug Info ({debugInfo.length}) - Role Structure
          </span>
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
            Eligible: {eligibleUsers}/7 expected
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
              <CardDescription>
                {t('admin.userManagement.description')} 
                <span className="text-sm text-gray-500 ml-2">
                  (Expected: 7 eligible Sagsansvarlig users)
                </span>
              </CardDescription>
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
                {retryCount > 0 ? `Retrying... (attempt ${retryCount + 1})` : 'Loading users with updated role structure...'}
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
                  <span className="ml-2 text-indigo-600">
                    • Expected 7 eligible for Sagsansvarlig role
                  </span>
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
        onConfirm={confirmToggleUserStatus}
        isActivating={isActivating}
      />
    </>
  );
};

export default UserManagement;
