import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, X } from 'lucide-react';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

export type UserStatusFilter = 'all' | 'active' | 'inactive';

interface UserListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: UserRole[];
  onRoleFilterChange: (roles: UserRole[]) => void;
  statusFilter: UserStatusFilter;
  onStatusFilterChange: (status: UserStatusFilter) => void;
  availableRoles: UserRole[];
  roleCounts: Record<string, number>;
  getRoleLabel: (role: UserRole) => string;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const UserListToolbar: React.FC<UserListToolbarProps> = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  availableRoles,
  roleCounts,
  getRoleLabel,
  onReset,
  hasActiveFilters,
}) => {
  const { t } = useTranslation();

  const toggleRole = (role: UserRole, checked: boolean) => {
    onRoleFilterChange(checked ? [...roleFilter, role] : roleFilter.filter(r => r !== role));
  };

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('admin.userManagement.searchPlaceholder')}
          className="h-9 pl-9"
          aria-label={t('admin.userManagement.searchPlaceholder')}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 justify-start sm:w-[200px]">
            <Users className="mr-2 h-4 w-4" />
            <span className="truncate">
              {roleFilter.length === 0
                ? t('admin.userManagement.allRoles')
                : roleFilter.map(getRoleLabel).join(', ')}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-white">
          {availableRoles.map(role => (
            <DropdownMenuCheckboxItem
              key={role}
              checked={roleFilter.includes(role)}
              onCheckedChange={(checked) => toggleRole(role, Boolean(checked))}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex-1">{getRoleLabel(role)}</span>
              <Badge variant="secondary" className="ml-2">{roleCounts[role] || 0}</Badge>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as UserStatusFilter)}>
        <SelectTrigger className="h-9 sm:w-[170px]">
          <SelectValue placeholder={t('admin.userManagement.filterByStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('admin.userManagement.allStatuses')}</SelectItem>
          <SelectItem value="active">{t('admin.userManagement.statusActive')}</SelectItem>
          <SelectItem value="inactive">{t('admin.userManagement.statusInactive')}</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" className="h-9" onClick={onReset}>
          <X className="mr-1 h-4 w-4" />
          {t('admin.userManagement.resetFilters')}
        </Button>
      )}
    </div>
  );
};

export default UserListToolbar;
