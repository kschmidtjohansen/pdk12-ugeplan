
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, UserRole } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { useTranslation } from '@/context/TranslationContext';

interface UserTableRowProps {
  user: User & Partial<Employee>;
  onEdit: (user: User & Partial<Employee>) => void;
  onDelete: (user: User & Partial<Employee>) => void;
  getRoleLabel: (role: UserRole) => string;
  getInitials: (name: string) => string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  onEdit,
  onDelete,
  getRoleLabel,
  getInitials,
}) => {
  const { t } = useTranslation();

  return (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 profile-avatar">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.phone || '-'}</TableCell>
      <TableCell>{user.jobTitle || '-'}</TableCell>
      <TableCell>
        <StatusBadge variant={
          user.role === 'administrator' 
            ? 'info' 
            : user.role === 'skadeleder'
              ? 'success'
              : 'default'
          }>
          {getRoleLabel(user.role)}
        </StatusBadge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">{t('common.edit')}</span>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
            className="h-8 w-8 p-0 text-destructive"
            disabled={user.id === '1'} // Prevent deleting main admin
          >
            <span className="sr-only">{t('common.delete')}</span>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
