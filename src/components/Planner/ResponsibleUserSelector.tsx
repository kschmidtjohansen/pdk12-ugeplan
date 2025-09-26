import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/context/AuthContext';
import { DemoUserFiltering } from '@/utils/demoUserFiltering';
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
  console.log('[ResponsibleUserSelector] ROLE UPDATE - Debug info:');
  console.log('- Total employees loaded:', employees.length);
  console.log('- Selected user ID:', selectedUserId);
  console.log('- All employees with roles:', employees.map(e => ({
    name: e.name,
    role: e.role,
    id: e.id.substring(0, 8) + '...'
  })));

  // Use centralized demo user filtering for responsible users
  const eligibleUsers = DemoUserFiltering.getEligibleResponsibleUsers(employees, user?.email);
  
  // Add current user if they are demo user (for creating assignments)
  if (isDemoMode && user && !eligibleUsers.find(emp => emp.id === user.id)) {
    const currentUserEmployee = employees.find(emp => emp.id === user.id);
    if (currentUserEmployee) {
      eligibleUsers.push(currentUserEmployee);
    }
  }
  console.log('- Final eligible users count:', eligibleUsers.length);
  console.log('- Eligible users details:', eligibleUsers.map(u => ({
    name: u.name,
    role: u.role,
    id: u.id.substring(0, 8) + '...'
  })));

  // Enhanced user display for the new structure
  const getSelectedUserDisplay = () => {
    if (!selectedUserId || selectedUserId === '') {
      return t('planner.selectResponsibleUser');
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
      return t('planner.selectResponsibleUser');
    }
  };
  const handleUserSelect = (userId: string) => {
    console.log('[ResponsibleUserSelector] ROLE UPDATE - User selected:', {
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

  // Enhanced statistics for the new structure
  const getDetailedStats = () => {
    const administrators = employees.filter(e => e.role === 'administrator');
    const skadeledere = employees.filter(e => e.role === 'skadeleder');
    const servicemedarbejdere = employees.filter(e => e.role === 'servicemedarbejder');
    return {
      total: employees.length,
      administrators: administrators.length,
      skadeledere: skadeledere.length,
      servicemedarbejdere: servicemedarbejdere.length,
      eligible: eligibleUsers.length,
      adminNames: administrators.map(a => a.name),
      skadelederNames: skadeledere.map(s => s.name)
    };
  };
  const stats = getDetailedStats();
  return <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {t('planner.responsibleUser')}
      </Label>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between h-11 px-4 py-2 border-indigo-200 hover:border-indigo-300 focus:border-indigo-400">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              <span className="truncate">{getSelectedUserDisplay()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] max-h-60 overflow-y-auto z-[100] bg-background border border-border shadow-lg">
          {/* No responsible user option */}
          <DropdownMenuItem onClick={() => handleUserSelect('none')} className="cursor-pointer p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between w-full space-x-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gray-400" />
                <span>{t('planner.noResponsibleUser')}</span>
              </div>
            </div>
          </DropdownMenuItem>
          
          {eligibleUsers.length === 0 ? <DropdownMenuItem disabled className="p-2">
              <div className="text-gray-500 text-sm">
                <div>{t('employees.noResponsibleUsersFound')}</div>
                {process.env.NODE_ENV === 'development' && <div className="mt-1 text-xs">
                    Debug: {employees.length} total users loaded
                    <br />Expected 7 eligible users (3 admin + 4 skadeledere)
                    <br />Current: Admin: {stats.administrators} | Skadeledere: {stats.skadeledere}
                  </div>}
              </div>
            </DropdownMenuItem> : eligibleUsers.map(user => <DropdownMenuItem key={user.id} onClick={() => handleUserSelect(user.id)} className="cursor-pointer p-2 hover:bg-indigo-50">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                  <span className="truncate font-medium">{user.name}</span>
                </div>
              </DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Enhanced debug info for the new structure */}
      {process.env.NODE_ENV === 'development'}
    </div>;
};
export default ResponsibleUserSelector;