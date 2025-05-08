
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { User, UserRole } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { useTranslation } from '@/context/TranslationContext';
import UserTableRow from './UserTableRow';

interface UserTableProps {
  users: (User & Partial<Employee>)[];
  onEditUser: (user: User & Partial<Employee>) => void;
  onDeleteUser: (user: User & Partial<Employee>) => void;
  onResetPassword: (user: User & Partial<Employee>) => void;
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
