
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

  console.log('[ResponsibleUserSelector] DEBUG: Component rendering with:');
  console.log('[ResponsibleUserSelector] Total employees from hook:', employees.length);
  console.log('[ResponsibleUserSelector] Selected user ID:', selectedUserId);
  console.log('[ResponsibleUserSelector] Translation context working:', t('planner.responsibleUser'));

  // Filter employees to only show administrators and skadeleders
  const eligibleUsers = employees.filter(employee => {
    const isEligible = employee.role === 'administrator' || employee.role === 'skadeleder';
    console.log(`[ResponsibleUserSelector] Employee ${employee.name} (${employee.role}): eligible = ${isEligible}`);
    return isEligible;
  });

  console.log('[ResponsibleUserSelector] DEBUG: Final filtering results:');
  console.log('[ResponsibleUserSelector] Eligible users count:', eligibleUsers.length);
  console.log('[ResponsibleUserSelector] Eligible users:', eligibleUsers.map(u => ({ 
    id: u.id, 
    name: u.name, 
    role: u.role 
  })));

  // Get display text for selected user
  const getSelectedUserDisplay = () => {
    if (!selectedUserId || selectedUserId === '') {
      return t('planner.selectResponsibleUser');
    }
    
    const user = eligibleUsers.find(user => user.id === selectedUserId);
    console.log('[ResponsibleUserSelector] DEBUG: Finding selected user:', {
      selectedUserId,
      foundUser: user ? { id: user.id, name: user.name, role: user.role } : null
    });
    
    return user ? user.name : t('planner.selectResponsibleUser');
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    console.log('[ResponsibleUserSelector] User selection:', {
      userId,
      isNone: userId === 'none'
    });
    
    if (userId === 'none') {
      onUserSelect('');
    } else {
      onUserSelect(userId);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{t('planner.responsibleUser')}</Label>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-11 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="truncate">{getSelectedUserDisplay()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] max-h-60 overflow-y-auto z-50 bg-white border shadow-md">
          {/* No responsible user option */}
          <DropdownMenuItem
            onClick={() => handleUserSelect('none')}
            className="cursor-pointer p-2"
          >
            <div className="flex items-center justify-between w-full space-x-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>{t('planner.noResponsibleUser')}</span>
              </div>
            </div>
          </DropdownMenuItem>
          
          {eligibleUsers.length === 0 ? (
            <DropdownMenuItem disabled className="p-2">
              <span className="text-gray-500">
                {t('planner.noResponsibleUser')} - Debugging: {employees.length} total employees loaded
              </span>
            </DropdownMenuItem>
          ) : (
            eligibleUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="cursor-pointer p-2"
              >
                <div className="flex items-center justify-between w-full space-x-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <span className="truncate">{user.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">({user.role})</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-1 p-2 bg-gray-50 rounded">
          Debug: {employees.length} total, {eligibleUsers.length} eligible | Translation: "{t('planner.responsibleUser')}"
        </div>
      )}
    </div>
  );
};

export default ResponsibleUserSelector;
