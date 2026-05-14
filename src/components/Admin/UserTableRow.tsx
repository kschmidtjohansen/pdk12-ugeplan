
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Key, Trash, UserCheck, UserX, MoreHorizontal } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
  banned_until?: string | null;
  avatar_url?: string;
}

interface UserTableRowProps {
  user: AdminUser;
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onToggleUserStatus: (user: AdminUser) => void;
  getRoleLabel: (role: UserRole) => string;
  getInitials: (name: string) => string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  onToggleUserStatus,
  getRoleLabel,
  getInitials,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const isUserActive = !user.banned_until || new Date(user.banned_until) <= new Date();

  const MobileActions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('common.actions') || 'Handlinger'}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white w-48">
        <DropdownMenuItem onClick={() => onToggleUserStatus(user)}>
          {isUserActive ? <UserX className="h-4 w-4 mr-2 text-red-600" /> : <UserCheck className="h-4 w-4 mr-2 text-green-600" />}
          {isUserActive ? t('admin.userManagement.deactivateUser') : t('admin.userManagement.activateUser')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(user)}>
          <Key className="h-4 w-4 mr-2" />
          {t('admin.passwords.resetPassword') || 'Nulstil adgangskode'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditUser(user)}>
          <Edit className="h-4 w-4 mr-2" />
          {t('admin.userManagement.editUser')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDeleteUser(user)} className="text-destructive">
          <Trash className="h-4 w-4 mr-2" />
          {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const DesktopActions = () => (
    <div className="flex justify-end gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onToggleUserStatus(user)}
              aria-label={isUserActive ? t('admin.userManagement.deactivateUser') : t('admin.userManagement.activateUser')}
              className={`h-8 w-8 ${isUserActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
              {isUserActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{isUserActive ? t('admin.userManagement.deactivateUser') : t('admin.userManagement.activateUser')}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onResetPassword(user)} className="h-8 w-8" aria-label={t('admin.passwords.resetPasswordFor', { name: user.name }) || 'Nulstil adgangskode'}>
              <Key className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{t('admin.passwords.resetPasswordFor', { name: user.name })}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onEditUser(user)} className="h-8 w-8" aria-label={t('admin.userManagement.editUser') || 'Rediger bruger'}>
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{t('admin.userManagement.editUser')}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user)} className="h-8 w-8 text-destructive hover:text-destructive" aria-label={t('common.delete') || 'Slet'}>
              <Trash className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{t('common.delete')}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 bg-polygon-blue text-white">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className={`font-medium ${isUserActive ? 'text-gray-900' : 'text-gray-500'}`}>
              {user.name}
              {!isUserActive && (
                <span className="ml-2 text-xs text-red-600">({t('admin.userManagement.inactive')})</span>
              )}
            </div>
            <div className="text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-600 hidden md:table-cell">
        {getRoleLabel(user.role)}
      </td>
      <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 whitespace-nowrap">
        {isMobile ? <MobileActions /> : <DesktopActions />}
      </td>
    </tr>
  );
};

export default UserTableRow;
