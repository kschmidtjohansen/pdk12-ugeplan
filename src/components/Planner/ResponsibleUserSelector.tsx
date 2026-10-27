import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDepartment } from '@/context/DepartmentContext';
import { useQuery } from '@tanstack/react-query';
import { unifiedDataService } from '@/services/data/unifiedDataService';
import type { Employee } from '@/types/employee';
import { isEligibleResponsibleUser } from '@/utils/responsibleUsers';

interface ResponsibleUserSelectorProps {
  selectedUserId: string;
  onUserSelect: (userId: string) => void;
  departmentId?: string | null;
}

const ResponsibleUserSelector: React.FC<ResponsibleUserSelectorProps> = ({
  selectedUserId,
  onUserSelect,
  departmentId
}) => {
  const { t } = useTranslation();
  const { employees: scopedEmployees } = useEmployees();
  const { user, isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const sourceDepartmentId = departmentId ?? selectedDepartmentId;
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Case managers are chosen from the whole department, regardless of the sub-department filter.
  const { data: departmentEmployees } = useQuery({
    queryKey: ['responsible-user-candidates', sourceDepartmentId],
    enabled: !isDemoMode && !!sourceDepartmentId,
    queryFn: async () => {
      if (!sourceDepartmentId) throw new Error('Afdeling mangler');
      const res = await unifiedDataService.fetchEmployees(sourceDepartmentId, null);
      if (res.error) throw new Error(res.error);
      return res.data as Employee[];
    },
    staleTime: 60_000,
  });

  const employees: Employee[] = React.useMemo(() => {
    const map = new Map<string, Employee>();
    [...(departmentEmployees || []), ...(sourceDepartmentId === selectedDepartmentId ? scopedEmployees : [])].forEach(e => { if (!map.has(e.id)) map.set(e.id, e); });
    return Array.from(map.values());
  }, [departmentEmployees, scopedEmployees, sourceDepartmentId, selectedDepartmentId]);

  const eligibleUsers = employees.filter(isEligibleResponsibleUser);
  
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
    setOpen(false);
  };

  const renderUserList = () => (
    <div className="py-1">
      <button
        type="button"
        onPointerUp={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleUserSelect('none');
        }}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        className={`w-full text-left flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors border-b border-border/40 ${
          !selectedUserId || selectedUserId === '' ? 'bg-accent/30' : 'hover:bg-accent/50'
        }`}
      >
        <UserCheck className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{t('planner.noResponsibleUser')}</span>
      </button>
      
      {eligibleUsers.length === 0 ? (
        <div className="p-4 text-muted-foreground text-sm">
          {t('employees.noResponsibleUsersFound')}
        </div>
      ) : (
        eligibleUsers.map((eligibleUser, index) => (
          <button
            key={eligibleUser.id}
            type="button"
            onPointerUp={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleUserSelect(eligibleUser.id);
            }}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className={`w-full text-left flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors ${
              index < eligibleUsers.length - 1 ? 'border-b border-border/40' : ''
            } ${
              selectedUserId === eligibleUser.id ? 'bg-accent/30' : 'hover:bg-accent/50'
            }`}
          >
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="truncate font-medium text-foreground">{eligibleUser.name}</span>
          </button>
        ))
      )}
    </div>
  );


  const triggerButton = (
    <Button variant="outline" className="w-full justify-between h-11 px-4 py-2 border-border hover:border-border">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <span className="truncate">{getSelectedUserDisplay()}</span>
      </div>
    </Button>
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {t('planner.responsibleUser')}
      </Label>
      
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            {triggerButton}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('planner.responsibleUser')}</DrawerTitle>
            </DrawerHeader>
            <div 
              className="max-h-[60dvh] overflow-y-auto px-4 pb-4"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {renderUserList()}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover modal={true} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0 z-[60] bg-popover border shadow-lg" 
            sideOffset={4}
          >
            <div 
              className="max-h-60 overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
            >
              {renderUserList()}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ResponsibleUserSelector;
