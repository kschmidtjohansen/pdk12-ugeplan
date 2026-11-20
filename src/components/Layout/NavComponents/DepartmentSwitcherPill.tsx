import React from 'react';
import { Building2, ChevronDown, Layers } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

interface Props {
  /** pill (default), box: the sidebar's "Afdeling Kolding" button, inline: "Kolding ▾" in the top bar. */
  variant?: 'pill' | 'box' | 'inline';
}

const DepartmentSwitcherPill: React.FC<Props> = ({ variant = 'pill' }) => {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = useAuth();
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
  const currentSub = userSubDepartments.find((s) => s.id === selectedSubDepartmentId);
  const titleText = currentSub ? `${currentDept.name} · ${currentSub.name}` : currentDept.name;

  if (!canSwitchDept && !canSwitchSub) {
    if (variant === 'box') {
      return (
        <div className="flex items-center gap-2 rounded-control bg-muted/80 px-2.5 py-2 text-[13px]">
          <span className="text-muted-foreground">{t('common.department')}</span>
          <span className="truncate font-semibold text-foreground">{titleText}</span>
        </div>
      );
    }
    if (variant === 'inline') return <span className="truncate text-[13px] font-semibold text-foreground">{titleText}</span>;
    return null;
  }

  const colors = getDepartmentColorClasses(currentDept.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'box' ? (
          <Button variant="ghost" type="button" title={titleText} className="h-auto w-full justify-start gap-2 rounded-control bg-muted/80 px-2.5 py-2 text-[13px] font-normal hover:bg-muted">
            <span className="text-muted-foreground">{t('common.department')}</span>
            <span className="truncate font-semibold text-foreground">{titleText}</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </Button>
        ) : variant === 'inline' ? (
          <Button variant="ghost" type="button" title={titleText} className="h-8 gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-foreground">
            <span className="truncate">{titleText}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </Button>
        ) : (
        <Button
          variant="ghost"
          type="button"
          title={titleText}
          className={cn(
            'inline-flex min-h-7 h-auto items-center gap-1 max-w-full px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
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
        </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={variant === 'pill' ? 'top' : 'bottom'} className="w-56">
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
              {(isAdmin || isSkadeleder) && (
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
