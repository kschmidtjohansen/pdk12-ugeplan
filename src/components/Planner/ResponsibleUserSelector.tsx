
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

  console.log('[ResponsibleUserSelector] PHASE 4 FIX - Debug info:');
  console.log('- Total employees loaded:', employees.length);
  console.log('- Selected user ID:', selectedUserId);
  console.log('- All employees with roles:', employees.map(e => ({ 
    name: e.name, 
    role: e.role, 
    id: e.id.substring(0, 8) + '...' 
  })));

  // PHASE 4 FIX: Filter employees to only show administrators and skadeledere with proper role validation
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

  // Get display text for selected user with better validation
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
      return t('planner.selectResponsibleUser') || 'Vælg sagsansvarlig';
    }
  };

  // Handle user selection with enhanced logging
  const handleUserSelect = (userId: string) => {
    console.log('[ResponsibleUserSelector] PHASE 4 FIX - User selected:', {
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
              <span className="text-gray-500">
                {t('employees.noResponsibleUsersFound') || 'Ingen sagsansvarlige fundet'} 
                {process.env.NODE_ENV === 'development' && ` (Debug: ${employees.length} medarbejdere indlæst)`}
              </span>
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
          <strong>PHASE 4 DEBUG:</strong> {employees.length} total employees, {eligibleUsers.length} eligible
          {selectedUserId && ` | Selected: ${selectedUserId.substring(0, 8)}...`}
          <br />
          <strong>Roles found:</strong> {employees.reduce((acc, emp) => {
            acc[emp.role] = (acc[emp.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)}
        </div>
      )}
    </div>
  );
};

export default ResponsibleUserSelector;
