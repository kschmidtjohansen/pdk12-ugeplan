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
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

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
    setOpen(false);
  };

  const renderUserList = () => (
    <div className="py-1">
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleUserSelect('none');
        }}
        className={`flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors border-b border-border/40 ${
          !selectedUserId || selectedUserId === '' ? 'bg-accent/30' : 'hover:bg-accent/50'
        }`}
      >
        <UserCheck className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{t('planner.noResponsibleUser')}</span>
      </div>
      
      {eligibleUsers.length === 0 ? (
        <div className="p-4 text-muted-foreground text-sm">
          {t('employees.noResponsibleUsersFound')}
        </div>
      ) : (
        eligibleUsers.map((eligibleUser, index) => (
          <div
            key={eligibleUser.id}
            onClick={(e) => {
              e.stopPropagation();
              handleUserSelect(eligibleUser.id);
            }}
            className={`flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors ${
              index < eligibleUsers.length - 1 ? 'border-b border-border/40' : ''
            } ${
              selectedUserId === eligibleUser.id ? 'bg-accent/30' : 'hover:bg-accent/50'
            }`}
          >
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="truncate font-medium text-foreground">{eligibleUser.name}</span>
          </div>
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
        <Popover modal={false} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0 z-[60] bg-popover border shadow-lg" 
            sideOffset={4}
            onPointerDownOutside={(event) => {
              const target = event.target as Element;
              if (target.closest('[data-radix-popper-content-wrapper]')) {
                event.preventDefault();
              }
            }}
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
