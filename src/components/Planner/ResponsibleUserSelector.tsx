
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmployees } from '@/hooks/useEmployees';

interface ResponsibleUserSelectorProps {
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
}

const ResponsibleUserSelector: React.FC<ResponsibleUserSelectorProps> = ({
  selectedUserId,
  onUserSelect
}) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();

  console.log('[ResponsibleUserSelector] COMPREHENSIVE FIX - Debug info:');
  console.log('- Total employees loaded:', employees.length);
  console.log('- Selected user ID:', selectedUserId);
  console.log('- All employees with roles:', employees.map(e => ({ 
    name: e.name, 
    role: e.role, 
    id: e.id.substring(0, 8) + '...' 
  })));

  // COMPREHENSIVE FIX: Enhanced filtering with detailed logging
  const eligibleUsers = employees.filter(employee => {
    const isEligible = employee.role === 'administrator' || employee.role === 'skadeleder';
    console.log(`- Employee "${employee.name}" (${employee.role}): eligible = ${isEligible}`);
    return isEligible;
  });

  console.log('- Final eligible users count:', eligibleUsers.length);
  console.log('- Eligible users details:', eligibleUsers.map(u => ({ 
    name: u.name, 
    role: u.role,
    id: u.id.substring(0, 8) + '...'
  })));

  // Enhanced user display with better fallback handling
  const getSelectedUserDisplay = () => {
    if (!selectedUserId || selectedUserId === '') {
      return t('planner.selectResponsibleUser') || 'Vælg sagsansvarlig';
    }
    
    const user = eligibleUsers.find(user => user.id === selectedUserId);
    if (user) {
      console.log(`[ResponsibleUserSelector] Found selected user: ${user.name} (${user.role})`);
      return user.name;
    } else {
      console.warn(`[ResponsibleUserSelector] Selected user ID ${selectedUserId} not found in eligible users`);
      // Try to find in all employees as fallback
      const fallbackUser = employees.find(emp => emp.id === selectedUserId);
      if (fallbackUser) {
        console.warn(`[ResponsibleUserSelector] Fallback: Found user ${fallbackUser.name} but role is ${fallbackUser.role}`);
        return `${fallbackUser.name} (${fallbackUser.role})`;
      }
      
      return t('planner.selectResponsibleUser') || 'Vælg sagsansvarlig';
    }
  };

  // Enhanced user selection with comprehensive logging
  const handleUserSelect = (userId: string) => {
    console.log('[ResponsibleUserSelector] COMPREHENSIVE FIX - User selected:', {
      userId: userId === 'none' ? 'none' : userId,
      isNone: userId === 'none'
    });
    
    if (userId === 'none') {
      onUserSelect('');
    } else {
      const selectedUser = eligibleUsers.find(u => u.id === userId);
      console.log('[ResponsibleUserSelector] Selected user details:', selectedUser?.name, selectedUser?.role);
      onUserSelect(userId);
    }
  };

  // Enhanced diagnostic information
  const getRoleDistribution = () => {
    const roleCounts = employees.reduce((acc, emp) => {
      acc[emp.role] = (acc[emp.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(roleCounts).map(([role, count]) => `${role}: ${count}`).join(', ');
  };

  const getDetailedStats = () => {
    const administrators = employees.filter(e => e.role === 'administrator');
    const skadeledere = employees.filter(e => e.role === 'skadeleder');
    
    return {
      total: employees.length,
      administrators: administrators.length,
      skadeledere: skadeledere.length,
      eligible: eligibleUsers.length,
      adminNames: administrators.map(a => a.name),
      skadelederNames: skadeledere.map(s => s.name)
    };
  };

  const stats = getDetailedStats();

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-indigo-700">
        {t('planner.responsibleUser') || 'Sagsansvarlig'} ⭐
      </Label>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-11 px-4 py-2 border-indigo-200 hover:border-indigo-300 focus:border-indigo-400"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              <span className="truncate">{getSelectedUserDisplay()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] max-h-60 overflow-y-auto z-50 bg-white border shadow-md">
          {/* No responsible user option */}
          <DropdownMenuItem
            onClick={() => handleUserSelect('none')}
            className="cursor-pointer p-2 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between w-full space-x-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gray-400" />
                <span>{t('planner.noResponsibleUser') || 'Ingen sagsansvarlig'}</span>
              </div>
            </div>
          </DropdownMenuItem>
          
          {eligibleUsers.length === 0 ? (
            <DropdownMenuItem disabled className="p-2">
              <div className="text-gray-500 text-sm">
                <div>{t('employees.noResponsibleUsersFound') || 'Ingen sagsansvarlige fundet'}</div>
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-1 text-xs">
                    Debug: {employees.length} total users loaded
                    <br />Admin: {stats.administrators} | Skadeledere: {stats.skadeledere}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ) : (
            eligibleUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="cursor-pointer p-2 hover:bg-indigo-50"
              >
                <div className="flex items-center justify-between w-full space-x-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-600" />
                    <span className="truncate font-medium">{user.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.role === 'administrator' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'administrator' ? 'Admin' : 'Skadeleder'}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Enhanced debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-1 p-2 bg-gray-50 rounded border">
          <strong>COMPREHENSIVE FIX DEBUG:</strong><br/>
          Total: {stats.total} | Eligible: {stats.eligible}<br/>
          Admins ({stats.administrators}): {stats.adminNames.join(', ') || 'None'}<br/>
          Skadeledere ({stats.skadeledere}): {stats.skadelederNames.join(', ') || 'None'}<br/>
          {selectedUserId && `Selected: ${selectedUserId.substring(0, 8)}...`}
        </div>
      )}
    </div>
  );
};

export default ResponsibleUserSelector;
