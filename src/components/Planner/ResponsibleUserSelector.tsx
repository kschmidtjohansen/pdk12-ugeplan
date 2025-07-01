
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

  console.log('[ResponsibleUserSelector] Debug info:');
  console.log('- Total employees:', employees.length);
  console.log('- Selected user ID:', selectedUserId);
  console.log('- All employees with roles:', employees.map(e => ({ name: e.name, role: e.role })));

  // Filter employees to only show administrators and skadeleders
  const eligibleUsers = employees.filter(employee => {
    const isEligible = employee.role === 'administrator' || employee.role === 'skadeleder';
    console.log(`- Employee "${employee.name}" (${employee.role}): eligible = ${isEligible}`);
    return isEligible;
  });

  console.log('- Final eligible users:', eligibleUsers.length, eligibleUsers.map(u => ({ name: u.name, role: u.role })));

  // Get display text for selected user
  const getSelectedUserDisplay = () => {
    if (!selectedUserId || selectedUserId === '') {
      return t('planner.selectResponsibleUser') || 'Vælg sagsansvarlig';
    }
    
    const user = eligibleUsers.find(user => user.id === selectedUserId);
    return user ? user.name : (t('planner.selectResponsibleUser') || 'Vælg sagsansvarlig');
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    console.log('[ResponsibleUserSelector] User selected:', userId === 'none' ? 'none' : userId);
    
    if (userId === 'none') {
      onUserSelect('');
    } else {
      onUserSelect(userId);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {t('planner.responsibleUser') || 'Sagsansvarlig'}
      </Label>
      
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
                <span>{t('planner.noResponsibleUser') || 'Ingen sagsansvarlig'}</span>
              </div>
            </div>
          </DropdownMenuItem>
          
          {eligibleUsers.length === 0 ? (
            <DropdownMenuItem disabled className="p-2">
              <span className="text-gray-500">
                {t('employees.noEmployees') || 'Ingen sagsansvarlige fundet'} (Debug: {employees.length} medarbejdere indlæst)
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
          Debug: {employees.length} total, {eligibleUsers.length} eligible users found
        </div>
      )}
    </div>
  );
};

export default ResponsibleUserSelector;
