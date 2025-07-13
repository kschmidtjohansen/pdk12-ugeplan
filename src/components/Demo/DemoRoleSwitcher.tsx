import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserCog, ChevronDown } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const DemoRoleSwitcher: React.FC = () => {
  const { isDemoMode, demoRole, setDemoRole } = useAuth();
  const { toast } = useToast();

  if (!isDemoMode) return null;

  const roles: { role: UserRole; label: string; description: string }[] = [
    { 
      role: 'administrator', 
      label: 'Administrator', 
      description: 'Full access to all features' 
    },
    { 
      role: 'skadeleder', 
      label: 'Skadeleder', 
      description: 'Can manage assignments and approve tasks' 
    },
    { 
      role: 'servicemedarbejder', 
      label: 'Servicemedarbejder', 
      description: 'Can view assigned tasks and request vacation' 
    }
  ];

  const handleRoleSwitch = (newRole: UserRole) => {
    if (newRole === demoRole) return;
    
    setDemoRole(newRole);
    
    toast({
      title: "Demo Role Switched",
      description: `Switching to ${roles.find(r => r.role === newRole)?.label}. Refreshing page...`,
    });

    // Refresh the page and redirect to dashboard
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const currentRoleLabel = roles.find(r => r.role === demoRole)?.label || 'Unknown';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 border-amber-300 hover:border-amber-400 text-amber-700"
        >
          <UserCog className="h-4 w-4" />
          Switch Role: {currentRoleLabel}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {roles.map((roleOption) => (
          <DropdownMenuItem
            key={roleOption.role}
            onClick={() => handleRoleSwitch(roleOption.role)}
            className={`cursor-pointer p-3 ${
              demoRole === roleOption.role 
                ? 'bg-amber-50 text-amber-900 font-medium' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col">
              <div className="font-medium">{roleOption.label}</div>
              <div className="text-xs text-gray-500">{roleOption.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};