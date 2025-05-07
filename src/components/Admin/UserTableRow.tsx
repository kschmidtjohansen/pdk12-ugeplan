
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserRole } from '@/context/AuthContext';
import { User } from '@/types/auth';
import { Employee } from '@/types/employee';
import { Edit, Trash2, Key } from 'lucide-react';

interface UserTableRowProps {
  user: User & Partial<Employee>;
  onEdit: (user: User & Partial<Employee>) => void;
  onDelete: (user: User & Partial<Employee>) => void;
  onResetPassword?: (user: User & Partial<Employee>) => void; // Add this
  getRoleLabel: (role: UserRole) => string;
  getInitials: (name: string) => string;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  onEdit,
  onDelete,
  onResetPassword,
  getRoleLabel,
  getInitials,
}) => {
  return (
    <TableRow key={user.id}>
      <TableCell className="flex items-center space-x-3">
        <Avatar>
          <AvatarFallback className="bg-polygon-purple text-white">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span>{user.name}</span>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.phone || "-"}</TableCell>
      <TableCell>{user.jobTitle || "-"}</TableCell>
      <TableCell>{getRoleLabel(user.role)}</TableCell>
      <TableCell>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {onResetPassword && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResetPassword(user)}
            >
              <Key className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
