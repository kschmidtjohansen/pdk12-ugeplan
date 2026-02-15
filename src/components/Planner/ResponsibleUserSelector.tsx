import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/context/AuthContext';

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
  const { user, isDemoMode } = useAuth();

  if (import.meta.env.DEV) {
    console.log('[ResponsibleUserSelector] Debug:', {
      totalEmployees: employees.length,
      selectedUserId,
      roles: employees.map(e => ({ name: e.name, role: e.role }))
    });
  }

  const eligibleUsers = employees.filter(emp => 
    emp.role === 'super_admin' || emp.role === 'administrator' || emp.role === 'skadeleder'
  );
  
  if (isDemoMode && user && !eligibleUsers.find(emp => emp.id === user.id)) {
    const currentUserEmployee = employees.find(emp => emp.id === user.id);
    if (currentUserEmployee) {
      eligibleUsers.push(currentUserEmployee);
    }
  }

  const getSelectedUserDisplay = () => {
    if (!selectedUserId || selectedUserId === '') {
      return t('planner.selectResponsibleUser');
    }
    const found = eligibleUsers.find(u => u.id === selectedUserId);
    if (found) return found.name;
    
    const fallbackUser = employees.find(emp => emp.id === selectedUserId);
    if (fallbackUser) return `${fallbackUser.name} (${fallbackUser.role})`;
    
    return t('planner.selectResponsibleUser');
  };

  const handleUserSelect = (userId: string) => {
    if (import.meta.env.DEV) {
      console.log('[ResponsibleUserSelector] User selected:', userId);
    }
    if (userId === 'none') {
      onUserSelect('');
    } else {
      onUserSelect(userId);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {t('planner.responsibleUser')}
      </Label>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-11 px-4 py-2 border-indigo-200 hover:border-indigo-300 focus:border-indigo-400">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              <span className="truncate">{getSelectedUserDisplay()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] max-h-60 overflow-y-auto z-50 bg-popover border shadow-md">
          <DropdownMenuItem onClick={() => handleUserSelect('none')} className="cursor-pointer p-2 hover:bg-muted/50">
            <div className="flex items-center justify-between w-full space-x-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span>{t('planner.noResponsibleUser')}</span>
              </div>
            </div>
          </DropdownMenuItem>
          
          {eligibleUsers.length === 0 ? (
            <DropdownMenuItem disabled className="p-2">
              <div className="text-muted-foreground text-sm">
                <div>{t('employees.noResponsibleUsersFound')}</div>
              </div>
            </DropdownMenuItem>
          ) : (
            eligibleUsers.map(user => (
              <DropdownMenuItem key={user.id} onClick={() => handleUserSelect(user.id)} className="cursor-pointer p-2 hover:bg-indigo-50">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                  <span className="truncate font-medium">{user.name}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ResponsibleUserSelector;
