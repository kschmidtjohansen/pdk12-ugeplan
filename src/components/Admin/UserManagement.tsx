import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserRole, useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDownAZ, ArrowUpAZ, RefreshCw, AlertCircle, Wifi, WifiOff, Bug, Database, CheckCircle, Filter } from 'lucide-react';

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
  const { isDemoMode, user: authUser } = useAuth();
  const { selectedDepartmentId, departments, isSubstituteEnabled } = useDepartment();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userAccessData, setUserAccessData] = useState<{ user_id: string; department_id: string }[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('current');
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

  const isSuperAdmin = authUser?.role === 'super_admin';
  const isAdmin = authUser?.role === 'administrator';
  const canSeeUnassigned = isSuperAdmin || isAdmin;

  // Demo user constants
  const DEMO_USER_EMAIL = 'test@polygongroup.com';
  const DEMO_USER_ID = '165cdbc9-6722-4c96-97d2-1a87185c8133';

  // Filter users by department + hide demo user for non-demo users
  const filteredUsers = useMemo(() => {
    if (!users.length) return [];
    
    // First: remove demo user from list if current user is NOT the demo user
    let baseUsers = users;
    if (!isDemoMode) {
      baseUsers = users.filter(u => u.email !== DEMO_USER_EMAIL && u.id !== DEMO_USER_ID);
    }
    
    if (departmentFilter === 'unassigned') {
      const usersWithAccess = new Set(userAccessData.map(ua => ua.user_id));
      return baseUsers.filter(u => !usersWithAccess.has(u.id));
    }
    
    // If a specific department is selected from the dropdown
    const filterDeptId = departmentFilter === 'current' ? selectedDepartmentId : departmentFilter;
    if (!filterDeptId) return baseUsers;
    const usersInDept = new Set(
      userAccessData.filter(ua => ua.department_id === filterDeptId).map(ua => ua.user_id)
    );
    return baseUsers.filter(u => usersInDept.has(u.id));
  }, [users, userAccessData, departmentFilter, selectedDepartmentId, isDemoMode]);

  // Calculate role statistics from filtered users
  const roleCounts = filteredUsers.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<UserRole, number>);
  const eligibleUsers = (roleCounts.administrator || 0) + (roleCounts.skadeleder || 0);
  
  const handleCreateVikar = () => {
    // Set form data for vikar creation
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'vikar' as UserRole
    });
    setCurrentUser(null);
    setUserDialogOpen(true);
  };
  
  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    setDebugInfo(prev => [`[${timestamp}] ${info}`, ...prev.slice(0, 19)]);
    if (import.meta.env.DEV) console.log(`[UserManagement Debug] ${info}`);
  };

  // Demo mode user fetching
  const fetchDemoUsers = async () => {
    try {
      addDebugInfo('DEMO MODE: Fetching demo users via RPC');
      
      const { data, error } = await supabase.rpc('get_demo_profiles_admin_detailed', { full_access: true });
      
      if (error) {
        addDebugInfo(`DEMO RPC error: ${error.message}`);
        throw error;
      }
      
      if (!data || data.length === 0) {
        addDebugInfo('DEMO: No users found');
        return { users: [], total: 0 };
      }
      
      const demoUsers: AdminUser[] = data.map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        jobTitle: profile.job_title,
        role: profile.role as UserRole,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: null,
        banned_until: null,
        onLeave: profile.on_leave || false,
        notes: profile.notes
      }));
      
      addDebugInfo(`DEMO: Loaded ${demoUsers.length} demo users`);
      return { users: demoUsers, total: demoUsers.length };
    } catch (err) {
      addDebugInfo(`DEMO FETCH FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  // FIXED: Enhanced fallback using direct database queries with proper role mapping
  const fetchUsersDirectly = async () => {
    try {
      setUsingFallback(true);
      addDebugInfo('FALLBACK: Using direct database queries with fixed role mapping');

      // Get profiles directly
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select(`
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
          if (import.meta.env.DEV) console.warn('[UserManagement] User roles access restricted, using default roles');
          if (import.meta.env.DEV) console.warn('[UserManagement] Details:', rolesError);
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
          phone: profile.phone,
          jobTitle: profile.job_title,
          role: userRole as UserRole,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_sign_in_at: null,
          banned_until: null,
          onLeave: profile.on_leave || false,
          notes: profile.notes
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
        addDebugInfo('FRESH FETCH: Starting user fetch');
        setRetryCount(0);
        setUsingFallback(false);
        setEdgeFunctionWorking(null);
      }
      
      let data;

      // Fetch user_access data for department filtering
      const { data: accessData } = await supabase
        .from('user_access')
        .select('user_id, department_id');
      setUserAccessData(accessData || []);
      if (isDemoMode) {
        data = await fetchDemoUsers();
        setConnectionStatus('connected');
      } else if (!usingFallback) {
        // Try edge function first (unless we're already using fallback)
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
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot create users.');
    }
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
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot update users.');
    }
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
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot delete users.');
    }
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
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot change user status.');
    }
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

  // Load users on component mount and when department changes
  useEffect(() => {
    fetchUsers();
  }, [selectedDepartmentId]);

  // Set up realtime subscription or polling based on demo mode
  useEffect(() => {
    if (isDemoMode) {
      // Use polling for demo mode
      const interval = setInterval(() => {
        if (import.meta.env.DEV) console.log('[UserManagement] Demo mode: polling for updates');
        fetchUsers();
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(interval);
    } else {
      // Use realtime for production
      const channel = supabase.channel('profiles_admin_changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, payload => {
        if (import.meta.env.DEV) console.log('Profile change detected in admin:', payload.eventType);
        fetchUsers();
      }).subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isDemoMode]);

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
      if (import.meta.env.DEV) console.error('[UserManagement] Error toggling user status:', err);
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
      if (import.meta.env.DEV) console.error('[UserManagement] Error deleting user:', err);
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
      if (import.meta.env.DEV) console.error('[UserManagement] Error saving user:', err);
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
          return 'text-muted-foreground';
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
            </div>
            <div className="flex items-center space-x-2">
              {/* Department filter dropdown */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">
                      {departments?.find(d => d.id === selectedDepartmentId)?.name || t('admin.userManagement.filterByDepartment')}
                    </SelectItem>
                    {departments?.filter(d => d.id !== selectedDepartmentId).map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                    {canSeeUnassigned && (
                      <SelectItem value="unassigned">{t('admin.userManagement.unassignedUsers')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={handleSmartRetry} title="Refresh users list with smart retry" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={toggleSortDirection} title={sortDirection === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}>
                {sortDirection === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
              </Button>
              <Button onClick={handleCreateUser} className="bg-polygon-blue hover:bg-polygon-darkblue">
                {t('admin.userManagement.addUser')}
              </Button>
              {isSubstituteEnabled && (
                <Button onClick={handleCreateVikar} variant="outline" className="border-polygon-blue text-polygon-blue hover:bg-polygon-blue/10">
                  {t('employees.addVikar')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex flex-col justify-center items-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-polygon-blue"></div>
              <p className="text-sm text-muted-foreground">
                {retryCount > 0 ? `Smart retry... (attempt ${retryCount + 1})` : 'Loading users with fixed role handling...'}
              </p>
            </div> : users.length === 0 ? <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-muted-foreground mb-2">
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
              <UserTable users={filteredUsers} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} onResetPassword={handleResetPassword} onToggleUserStatus={handleToggleUserStatus} getRoleLabel={getRoleLabel} getInitials={getInitials} />
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