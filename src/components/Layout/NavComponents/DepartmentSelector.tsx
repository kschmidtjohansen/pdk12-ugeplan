import React, { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useDepartment } from '@/context/DepartmentContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  const [animating, setAnimating] = useState(false);

  const handleSwitch = (deptId: string) => {
    const dept = userDepartments.find(d => d.id === deptId);
    switchDepartment(deptId);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    if (dept) {
      toast({
        title: t('admin.departmentSwitched').replace('{name}', dept.name),
      });
    }
  };

  const handleSubSwitch = (subId: string) => {
    setSelectedSubDepartmentId(subId);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    const sub = userSubDepartments.find(s => s.id === subId);
    if (sub) {
      toast({
        title: t('admin.departmentSwitched').replace('{name}', sub.name),
      });
    }
  };

  if (loading || userDepartments.length === 0) return null;

  const selectedSub = userSubDepartments.find(s => s.id === selectedSubDepartmentId);
  const hasSubs = userSubDepartments.length > 0;
  const hasMultipleDepts = userDepartments.length > 1;
  const hasMultipleSubs = userSubDepartments.length > 1;

  const deptLabel = getShortName(selectedDepartment?.name || userDepartments[0].name);
  const showDropdown = hasMultipleDepts || hasMultipleSubs;

  // Build compact label: "Afd. 02 > Fugt & Skimmel"
  const displayLabel = hasSubs && selectedSub
    ? `${deptLabel} > ${selectedSub.name}`
    : deptLabel;

  if (!showDropdown) {
    // No dropdown needed - single dept, single or no sub
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted-foreground",
        animating && "animate-fade-in ring-2 ring-primary/40 rounded-lg"
      )}>
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate max-w-[220px]">{displayLabel}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 h-auto text-sm font-medium hover:bg-muted/50 transition-all duration-300",
            animating && "animate-fade-in ring-2 ring-primary/40 rounded-lg"
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[220px]">{displayLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px] z-[60]">
        {/* Sub-departments section first (most frequently switched) */}
        {hasMultipleSubs && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Underafdelinger</DropdownMenuLabel>
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
          </>
        )}

        {/* Separator between sections */}
        {hasMultipleSubs && hasMultipleDepts && <DropdownMenuSeparator />}

        {/* Main departments section */}
        {hasMultipleDepts && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Afdelinger</DropdownMenuLabel>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DepartmentSelector;
