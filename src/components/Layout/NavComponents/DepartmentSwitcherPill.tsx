import React from 'react';
import { Building2, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { getDepartmentColorClasses } from '@/utils/departmentColor';
import { cn } from '@/lib/utils';

const DepartmentSwitcherPill: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const {
    userDepartments,
    selectedDepartmentId,
    switchDepartment,
    userSubDepartments,
    selectedSubDepartmentId,
    setSelectedSubDepartmentId,
  } = useDepartment();

  const currentDept = userDepartments.find((d) => d.id === selectedDepartmentId);
  if (!currentDept) return null;

  const canSwitchDept = userDepartments.length > 1;
  const canSwitchSub = userSubDepartments.length > 0;
  if (!canSwitchDept && !canSwitchSub) return null;

  const currentSub = userSubDepartments.find((s) => s.id === selectedSubDepartmentId);
  const colors = getDepartmentColorClasses(currentDept.id);
  const titleText = currentSub ? `${currentDept.name} · ${currentSub.name}` : currentDept.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={titleText}
          className={cn(
            'inline-flex items-center gap-1.5 max-w-[180px] px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
            colors.pill
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', colors.dot)} />
          <span className="truncate">{currentDept.name}</span>
          {currentSub && (
            <span className="truncate text-muted-foreground font-normal">
              {currentSub.name}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        {canSwitchDept && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t('common.department') || 'Afdeling'}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedDepartmentId || ''}
              onValueChange={(value) => switchDepartment(value)}
            >
              {userDepartments.map((dept) => (
                <DropdownMenuRadioItem key={dept.id} value={dept.id} className="cursor-pointer">
                  {dept.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
        {canSwitchSub && (
          <>
            {canSwitchDept && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center gap-2 pt-1">
              <Layers className="h-4 w-4 text-muted-foreground" />
              {t('common.subDepartment') || 'Underafdeling'}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedSubDepartmentId || ''}
              onValueChange={(value) => setSelectedSubDepartmentId(value || null)}
            >
              {isAdmin && (
                <DropdownMenuRadioItem value="" className="cursor-pointer">
                  {t('common.all') || 'Alle'}
                </DropdownMenuRadioItem>
              )}
              {userSubDepartments.map((sub) => (
                <DropdownMenuRadioItem key={sub.id} value={sub.id} className="cursor-pointer">
                  {sub.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DepartmentSwitcherPill;
