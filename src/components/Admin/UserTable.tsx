
import React from 'react';
import UserTableRow, { AdminUser } from './UserTableRow';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

interface UserTableProps {
  users: AdminUser[];
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onToggleUserStatus: (user: AdminUser) => void;
  getRoleLabel: (role: UserRole) => string;
  getInitials: (name: string) => string;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  onToggleUserStatus,
  getRoleLabel,
  getInitials,
}) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              {t('admin.userManagement.name')}
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">
              {t('admin.userManagement.role')}
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">{t('admin.userManagement.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              onEditUser={onEditUser}
              onDeleteUser={onDeleteUser}
              onResetPassword={onResetPassword}
              onToggleUserStatus={onToggleUserStatus}
              getRoleLabel={getRoleLabel}
              getInitials={getInitials}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
