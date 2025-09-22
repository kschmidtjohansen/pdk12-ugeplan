import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDownAZ, ArrowUpAZ, RefreshCw, AlertCircle, Wifi, WifiOff, Bug, Database, CheckCircle } from 'lucide-react';

// Import refactored components
import UserTable from './UserTable';
import UserFormDialog from './UserFormDialog';
import UserDeleteDialog from './UserDeleteDialog';
import PasswordChangeDialog from './PasswordChangeDialog';
import UserStatusDialog from './UserStatusDialog';
import { AdminUser } from './UserTableRow';
const UserManagement: React.FC = () => {
  const {
    toast
  } = useToast();
  const {
    t
  } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'fallback'>('connected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [edgeFunctionWorking, setEdgeFunctionWorking] = useState<boolean | null>(null);

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
    role: 'servicemedarbejder' as UserRole
  });

  // Calculate role statistics - moved to main component scope
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<UserRole, number>);
  const eligibleUsers = (roleCounts.administrator || 0) + (roleCounts.skadeleder || 0);
  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    setDebugInfo(prev => [`[${timestamp}] ${info}`, ...prev.slice(0, 19)]);
    console.log(`[UserManagement Debug] ${info}`);
  };

  // FIXED: Enhanced fallback using direct database queries with proper role mapping
  const fetchUsersDirectly = async () => {
    try {
      setUsingFallback(true);
      addDebugInfo('FALLBACK: Using direct database queries with fixed role mapping');

      // Use secure function to get profiles (addresses security vulnerability)
      console.log('[fetchUsersWithFallback] Using secure profiles function');
      
      // Get basic profiles data using secure function
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_profiles_basic');
        
      if (profilesError) {
        addDebugInfo(`Secure profiles function error: ${profilesError.message}`);
        // Check if this is a permission error due to new RLS policies
        if (profilesError.message?.includes('permission') || 
            profilesError.message?.includes('policy') || 
            profilesError.message?.includes('access denied')) {
          throw new Error('You do not have permission to view user profiles. Please contact an administrator.');
        }
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        addDebugInfo('FALLBACK: No profiles returned - this may indicate insufficient permissions or no users exist');
        setUsers([]);
        return;
      }

      // Get user roles with proper error handling
      const {
        data: userRoles,
        error: rolesError
      } = await supabase.from('user_roles').select('user_id, role');
      if (rolesError) {
        addDebugInfo(`FALLBACK roles error: ${rolesError.message}`);
        // Check if this is a permission error due to new RLS policies
        if (rolesError.message?.includes('permission') || 
            rolesError.message?.includes('policy') || 
            rolesError.message?.includes('access denied')) {
          console.warn('[UserManagement] User roles access restricted, using default roles');
          addDebugInfo('FALLBACK: Using default servicemedarbejder role due to restricted access');
          // Continue with empty roles array - will default to servicemedarbejder
        } else {
          throw rolesError;
        }
      }
      addDebugInfo(`FALLBACK: Got ${profiles?.length || 0} profiles and ${userRoles?.length || 0} role assignments`);

      // FIXED: Proper data combination with role mapping
      const combinedUsers = profiles?.map(profile => {
        const roleData = userRoles?.find(r => r.user_id === profile.id);
        const userRole = roleData?.role || 'servicemedarbejder';
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone || '', // Handle missing sensitive field
          jobTitle: profile.job_title,
          role: userRole as UserRole,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_sign_in_at: null,
          banned_until: null,
          onLeave: profile.on_leave ?? false, // Handle missing sensitive field
          notes: profile.notes || '' // Handle missing sensitive field
        };
      }) || [];

      // FIXED: Accurate statistics calculation
      const roleStatistics = combinedUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<UserRole, number>);
      const eligibleCount = (roleStatistics.administrator || 0) + (roleStatistics.skadeleder || 0);
      addDebugInfo(`FALLBACK SUCCESS: Loaded ${combinedUsers.length} users`);
      addDebugInfo(`FALLBACK Role distribution - Admin: ${roleStatistics.administrator || 0}, Skadeleder: ${roleStatistics.skadeleder || 0}, Service: ${roleStatistics.servicemedarbejder || 0}`);
      addDebugInfo(`FALLBACK Eligible users: ${eligibleCount}/7 expected`);
      return {
        users: combinedUsers,
        total: combinedUsers.length
      };
    } catch (err) {
      addDebugInfo(`FALLBACK FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  // FIXED: Enhanced edge function testing with better error capture
  const testEdgeFunction = async (): Promise<any> => {
    const {
      data: {
        session
      },
      error: sessionError
    } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('No valid session');
    }
    addDebugInfo(`EDGE FUNCTION: Testing with enhanced error handling`);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-list-users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (error) {
        // FIXED: Better error classification with specific HTTP status handling
        addDebugInfo(`EDGE FUNCTION ERROR: ${error.message}`);
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          throw new Error('Access denied - Administrator or Skadeleder role required');
        } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          throw new Error('Authentication failed - please log in again');
        } else if (error.message?.includes('500')) {
          throw new Error('Server error - using fallback method');
        } else {
          throw new Error(`Edge function error: ${error.message}`);
        }
      }
      if (data?.error) {
        addDebugInfo(`EDGE FUNCTION returned error: ${data.error}`);
        throw new Error(data.error);
      }

      // FIXED: Better success validation
      if (!data?.users || !Array.isArray(data.users)) {
        addDebugInfo(`EDGE FUNCTION returned invalid data structure`);
        throw new Error('Invalid response from edge function');
      }
      addDebugInfo(`EDGE FUNCTION SUCCESS: Got ${data.users.length} users`);
      if (data.debug) {
        addDebugInfo(`EDGE FUNCTION Debug: ${JSON.stringify(data.debug)}`);
      }
      setEdgeFunctionWorking(true);
      return data;
    } catch (err) {
      setEdgeFunctionWorking(false);
      addDebugInfo(`EDGE FUNCTION failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  // FIXED: Main user fetching with comprehensive error handling
  const fetchUsers = async (isRetry = false) => {
    try {
      setLoading(true);
      setLastError(null);
      if (isRetry) {
        setRetryCount(prev => prev + 1);
        addDebugInfo(`RETRY attempt: ${retryCount + 1}`);
      } else {
        addDebugInfo('FRESH FETCH: Starting user fetch with fixed role handling');
        setRetryCount(0);
        setUsingFallback(false);
        setEdgeFunctionWorking(null);
      }
      let data;

      // Try edge function first (unless we're already using fallback)
      if (!usingFallback) {
        try {
          data = await testEdgeFunction();
          setConnectionStatus('connected');
        } catch (err) {
          addDebugInfo(`EDGE FUNCTION failed, switching to fallback: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      addDebugInfo(`SUCCESS: Loaded ${data.users.length} users`);

      // Show success message if this was a retry
      if (isRetry && retryCount > 0) {
        toast({
          title: 'Success',
          description: `Successfully loaded ${data.users.length} users${usingFallback ? ' (using database fallback)' : ' (edge function working)'}`
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching users';
      addDebugInfo(`FETCH FAILED: ${errorMessage}`);
      setLastError(errorMessage);
      setConnectionStatus('error');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Create user with fallback
  const createUserWithFallback = async (userData: any) => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');
    addDebugInfo('Attempting to create user...');

    // Try edge function first
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-create-user', {
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
      const {
        error: profileError
      } = await supabase.from('profiles').update({
        name: updates.name,
        phone: updates.phone,
        job_title: updates.jobTitle
      }).eq('id', userId);
      if (profileError) throw profileError;

      // Update role if provided
      if (updates.role) {
        const {
          error: roleError
        } = await supabase.from('user_roles').update({
          role: updates.role
        }).eq('user_id', userId);
        if (roleError) throw roleError;
      }
      addDebugInfo('User updated successfully');
      return {
        success: true
      };
    } catch (err) {
      addDebugInfo(`User update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };
  const deleteUserWithFallback = async (userId: string) => {
    addDebugInfo(`Deleting user ${userId}...`);

    // Try edge function first
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-user-delete', {
        body: {
          userId
        }
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
        const {
          error: profileError
        } = await supabase.from('profiles').delete().eq('id', userId);
        if (profileError) throw profileError;
        addDebugInfo('User deleted via fallback method');
        return {
          success: true
        };
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
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-user-status', {
        body: {
          userId,
          active
        }
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
    addDebugInfo('PHASE 3: Starting smart retry with enhanced error handling...');
    await fetchUsers(true);
  };

  // Force fallback mode
  const handleForceFallback = async () => {
    addDebugInfo('PHASE 3: Forcing fallback mode with direct database access...');
    setUsingFallback(true);
    await fetchUsers(true);
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Set up realtime subscription for profile changes
  useEffect(() => {
    const channel = supabase.channel('profiles_admin_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles'
    }, payload => {
      console.log('Profile change detected in admin:', payload.eventType);
      fetchUsers(); // Refresh user data when profiles change
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper function to get role label
  const getRoleLabel = (role: UserRole): string => {
    return t(`admin.roles.${role}`);
  };
  const getInitials = (name: string): string => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };
  const handleCreateUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder'
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
      role: user.role
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
        title: isCurrentlyActive ? t('admin.userManagement.userDeactivated') : t('admin.userManagement.userActivated'),
        description: isCurrentlyActive ? t('admin.userManagement.userDeactivatedMsg', {
          name: currentUser.name
        }) : t('admin.userManagement.userActivatedMsg', {
          name: currentUser.name
        })
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
        variant: 'destructive'
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
        description: t('admin.userManagement.userDeletedMsg', {
          name: currentUser.name
        })
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
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole
    }));
  };
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!currentUser) {
        // Creating new user
        await createUserWithFallback({
          email: formData.email,
          password: '',
          // This will be handled by the form dialog
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
        description: currentUser ? t('admin.userManagement.updateSuccess') : t('admin.userManagement.createSuccess')
      });
    } catch (err) {
      console.error('[UserManagement] Error saving user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // FIXED: Enhanced connection status indicator
  const ConnectionStatusIndicator = () => {
    const getStatusColor = () => {
      switch (connectionStatus) {
        case 'connected':
          return 'text-green-600';
        case 'fallback':
          return 'text-blue-600';
        case 'disconnected':
          return 'text-orange-600';
        case 'error':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };
    const getStatusIcon = () => {
      switch (connectionStatus) {
        case 'connected':
          return <CheckCircle className="h-4 w-4" />;
        case 'fallback':
          return <Database className="h-4 w-4" />;
        case 'disconnected':
          return <WifiOff className="h-4 w-4" />;
        case 'error':
          return <AlertCircle className="h-4 w-4" />;
        default:
          return <Wifi className="h-4 w-4" />;
      }
    };
    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected':
          return edgeFunctionWorking ? 'Edge Function Active' : 'Connected';
        case 'fallback':
          return 'Database Fallback';
        case 'disconnected':
          return 'Connection Issues';
        case 'error':
          return 'Error';
        default:
          return 'Unknown';
      }
    };
    return (
      <div className={`flex items-center space-x-1 text-xs ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  };

  // FIXED: Enhanced debug info panel
  const DebugPanel = () => {
    if (debugInfo.length === 0) return null;
    return <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2 mb-2">
          <Bug className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Debug Info ({debugInfo.length}) - FIXED Role Structure
          </span>
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
            Eligible: {eligibleUsers}/7 expected
          </span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
            {edgeFunctionWorking === true ? 'Edge Function OK' : edgeFunctionWorking === false ? 'Using Fallback' : 'Testing...'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setDebugInfo([])} className="ml-auto h-6 px-2 text-xs">
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSmartRetry} className="h-6 px-2 text-xs">
            Smart Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={handleForceFallback} className="h-6 px-2 text-xs">
            Force Fallback
          </Button>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {debugInfo.map((info, index) => <div key={index} className="text-xs text-gray-600 font-mono">
              {info}
            </div>)}
        </div>
      </div>;
  };
  return <>
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
                
              </CardDescription>
              {lastError && <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{lastError}</span>
                  </div>
                </div>}
              <DebugPanel />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handleSmartRetry} title="Refresh users list with smart retry" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={toggleSortDirection} title={sortDirection === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}>
                {sortDirection === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
              </Button>
              <Button onClick={handleCreateUser} className="bg-polygon-blue hover:bg-polygon-darkblue">
                {t('admin.userManagement.addUser')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex flex-col justify-center items-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-polygon-blue"></div>
              <p className="text-sm text-gray-500">
                {retryCount > 0 ? `Smart retry... (attempt ${retryCount + 1})` : 'Loading users with fixed role handling...'}
              </p>
            </div> : users.length === 0 ? <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-500 mb-2">
                  {lastError ? 'Failed to load users. Fixed error handling active.' : 'No users found with current role authorization.'}
                </p>
                {lastError && <p className="text-sm text-red-600 mb-4">{lastError}</p>}
              </div>
              <div className="space-x-2">
                <Button onClick={handleSmartRetry} variant="outline">
                  Smart Retry
                </Button>
                <Button onClick={handleForceFallback} variant="outline">
                  Use Fallback
                </Button>
                <Button onClick={handleCreateUser} className="bg-polygon-blue hover:bg-polygon-darkblue">
                  Add First User
                </Button>
              </div>
            </div> : <div>
              <div className="mb-4 flex items-center justify-between">
                
                {retryCount > 0 && <div className="text-xs text-orange-600">
                    Smart retry attempts: {retryCount}
                  </div>}
              </div>
              <UserTable users={users} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} onResetPassword={handleResetPassword} onToggleUserStatus={handleToggleUserStatus} getRoleLabel={getRoleLabel} getInitials={getInitials} />
            </div>}
        </CardContent>
      </Card>

      {/* User Add/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <UserFormDialog currentUser={currentUser} formData={formData} handleInputChange={handleInputChange} handleRoleChange={handleRoleChange} handleSubmit={handleSubmitUser} onClose={() => setUserDialogOpen(false)} />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <UserDeleteDialog currentUser={currentUser} onConfirmDelete={confirmDeleteUser} isDeleting={isDeleting} />
      </AlertDialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <PasswordChangeDialog currentUser={currentUser} onClose={() => setPasswordDialogOpen(false)} />
      </Dialog>

      {/* User Status Toggle Dialog */}
      <UserStatusDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen} user={currentUser} onConfirm={confirmToggleUserStatus} isActivating={isActivating} />
    </>;
};
export default UserManagement;