import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserCog, ChevronDown } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';

export const DemoRoleSwitcher: React.FC = () => {
  const { isDemoMode, demoRole, setDemoRole, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const roles: { role: UserRole; label: string; description: string }[] = [
    { 
      role: 'administrator', 
      label: t('admin.roles.administrator') || 'Administrator', 
      description: t('admin.roles.administratorDesc') || 'Full access to all features' 
    },
    { 
      role: 'skadeleder', 
      label: t('admin.roles.skadeleder') || 'Skadeleder', 
      description: t('admin.roles.skadelederDesc') || 'Can manage assignments and approve tasks' 
    },
    { 
      role: 'servicemedarbejder', 
      label: t('admin.roles.servicemedarbejder') || 'Servicemedarbejder', 
      description: t('admin.roles.servicemedarbejderDesc') || 'Can view assigned tasks and request vacation' 
    }
  ];

  const handleRoleSwitch = (newRole: UserRole) => {
    const currentRole = demoRole || user?.role;
    if (newRole === currentRole) return;
    
    setDemoRole(newRole);
    
    toast({
      title: t('common.roleChanged') || "Demo Role Switched",
      description: t('common.switchingToRole', { role: roles.find(r => r.role === newRole)?.label }) || `Switched to ${roles.find(r => r.role === newRole)?.label}`,
    });

    // Use React Router navigation instead of page reload
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 300);
  };

  const currentRole = demoRole || user?.role;
  const currentRoleLabel = roles.find(r => r.role === currentRole)?.label || t('common.unknown') || 'Unknown';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 border-amber-300 hover:border-amber-400 text-amber-700"
        >
          <UserCog className="h-4 w-4" />
          {t('common.switchRole') || 'Switch Role'}: {currentRoleLabel}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {roles.map((roleOption) => (
          <DropdownMenuItem
            key={roleOption.role}
            onClick={() => handleRoleSwitch(roleOption.role)}
            className={`cursor-pointer p-3 ${
              currentRole === roleOption.role 
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