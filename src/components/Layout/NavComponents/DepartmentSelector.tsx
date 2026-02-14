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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getShortName = (name: string) => name.split('-')[0]?.trim() || name;

const DepartmentSelector: React.FC = () => {
  const { userDepartments, selectedDepartment, switchDepartment, loading } = useDepartment();
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

  if (loading || userDepartments.length === 0) return null;

  if (userDepartments.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{getShortName(selectedDepartment?.name || userDepartments[0].name)}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 h-auto text-sm font-medium hover:bg-muted/50 transition-all duration-300",
            animating && "animate-fade-in ring-2 ring-primary/40 rounded-lg"
          )}
        >
          <Building2 className="h-4 w-4" />
          <span>{selectedDepartment ? getShortName(selectedDepartment.name) : 'Vælg afdeling'}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
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
  );
};

export default DepartmentSelector;
