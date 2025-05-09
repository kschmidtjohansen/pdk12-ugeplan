
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import UserTableRow, { AdminUser } from './UserTableRow';

interface UserTableProps {
  users: AdminUser[];
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  getRoleLabel: (role: UserRole) => string;
  getInitials: (name: string) => string;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  getRoleLabel,
  getInitials,
}) => {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('admin.userManagement.name')}</TableHead>
          <TableHead>{t('admin.userManagement.email')}</TableHead>
          <TableHead>{t('employees.phone')}</TableHead>
          <TableHead>{t('employees.jobTitle')}</TableHead>
          <TableHead>{t('admin.userManagement.role')}</TableHead>
          <TableHead className="w-[100px]">{t('admin.userManagement.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserTableRow
            key={user.id}
            user={user}
            onEdit={onEditUser}
            onDelete={onDeleteUser}
            onResetPassword={onResetPassword}
            getRoleLabel={getRoleLabel}
            getInitials={getInitials}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
