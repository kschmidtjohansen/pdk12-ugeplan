
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

  // Filter employees to only show administrators and skadeleders
  const eligibleUsers = employees.filter(employee => 
    employee.role === 'administrator' || employee.role === 'skadeleder'
  );

  console.log('[ResponsibleUserSelector] Eligible users:', eligibleUsers.map(u => ({ id: u.id, name: u.name, role: u.role })));

  // Get display text for selected user
  const getSelectedUserDisplay = () => {
    if (!selectedUserId || selectedUserId === '') {
      return t('planner.selectResponsibleUser');
    }
    
    const user = eligibleUsers.find(user => user.id === selectedUserId);
    return user ? user.name : t('planner.selectResponsibleUser');
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    console.log('[ResponsibleUserSelector] Selecting user:', userId);
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
          
          {eligibleUsers.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className="cursor-pointer p-2"
            >
              <div className="flex items-center justify-between w-full space-x-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span className="truncate">{user.name}</span>
                  <span className="text-sm text-gray-500">({user.role})</span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ResponsibleUserSelector;
