import React, { useState } from 'react';
import { Building2, ChevronDown, Layers } from 'lucide-react';
import { useDepartment } from '@/context/DepartmentContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getShortName = (name: string) => {
  const num = name.split('-')[0]?.trim();
  return num ? `Afd. ${num}` : name;
};

const DepartmentSelector: React.FC = () => {
  const {
    userDepartments,
    selectedDepartment,
    switchDepartment,
    loading,
    selectedSubDepartmentId,
    setSelectedSubDepartmentId,
    userSubDepartments,
  } = useDepartment();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [animatingDept, setAnimatingDept] = useState(false);
  const [animatingSub, setAnimatingSub] = useState(false);

  const handleSwitch = (deptId: string) => {
    const dept = userDepartments.find(d => d.id === deptId);
    switchDepartment(deptId);
    setAnimatingDept(true);
    setTimeout(() => setAnimatingDept(false), 600);
    if (dept) {
      toast({ title: t('admin.departmentSwitched').replace('{name}', dept.name) });
    }
  };

  const handleSubSwitch = (subId: string) => {
    setSelectedSubDepartmentId(subId);
    setAnimatingSub(true);
    setTimeout(() => setAnimatingSub(false), 600);
    const sub = userSubDepartments.find(s => s.id === subId);
    if (sub) {
      toast({ title: t('admin.departmentSwitched').replace('{name}', sub.name) });
    }
  };

  if (loading || userDepartments.length === 0) return null;

  const selectedSub = userSubDepartments.find(s => s.id === selectedSubDepartmentId);
  const hasMultipleDepts = userDepartments.length > 1;
  const hasMultipleSubs = userSubDepartments.length > 1;
  const hasSubs = userSubDepartments.length > 0;

  const deptLabel = getShortName(selectedDepartment?.name || userDepartments[0].name);

  return (
    <div className="flex items-center gap-0.5">
      {/* Department selector/label */}
      {hasMultipleDepts ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 h-auto text-sm font-medium hover:bg-muted/50 transition-all duration-300",
                animatingDept && "animate-fade-in ring-2 ring-primary/40 rounded-lg"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[140px]">{deptLabel}</span>
              <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px] z-[60]">
            {userDepartments.map((dept) => (
              <DropdownMenuItem
                key={dept.id}
                onClick={() => handleSwitch(dept.id)}
                className={cn(
                  'cursor-pointer',
                  dept.id === selectedDepartment?.id && 'bg-accent font-medium'
                )}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {dept.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-muted-foreground",
          animatingDept && "animate-fade-in ring-2 ring-primary/40 rounded-lg"
        )}>
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[140px]">{deptLabel}</span>
        </div>
      )}

      {/* Separator + Sub-department selector */}
      {hasSubs && (
        <>
          <span className="text-muted-foreground/50 text-sm select-none">/</span>
          {hasMultipleSubs ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 h-auto text-sm font-medium hover:bg-muted/50 transition-all duration-300",
                    animatingSub && "animate-fade-in ring-2 ring-primary/40 rounded-lg"
                  )}
                >
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[160px]">{selectedSub?.name || '...'}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px] z-[60]">
                {userSubDepartments.map((sub) => (
                  <DropdownMenuItem
                    key={sub.id}
                    onClick={() => handleSubSwitch(sub.id)}
                    className={cn(
                      'cursor-pointer',
                      sub.id === selectedSubDepartmentId && 'bg-accent font-medium'
                    )}
                  >
                    {sub.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-muted-foreground",
              animatingSub && "animate-fade-in ring-2 ring-primary/40 rounded-lg"
            )}>
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[160px]">{selectedSub?.name || userSubDepartments[0]?.name}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DepartmentSelector;
