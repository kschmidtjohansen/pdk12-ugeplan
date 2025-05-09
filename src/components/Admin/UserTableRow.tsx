
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Key, Trash } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

interface UserTableRowProps {
  user: AdminUser;
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  getRoleLabel: (role: UserRole) => string;
  getInitials: (name: string) => string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  getRoleLabel,
  getInitials,
}) => {
  const { t } = useTranslation();

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 bg-polygon-blue text-white">
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-600 hidden md:table-cell">
        {getRoleLabel(user.role)}
      </td>
      <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 whitespace-nowrap">
        <div className="flex justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onResetPassword(user)}
                  className="h-8 w-8"
                >
                  <Key className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('admin.passwords.resetPasswordFor', { name: user.name })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditUser(user)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('admin.userManagement.editUser')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteUser(user)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common.delete')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;
