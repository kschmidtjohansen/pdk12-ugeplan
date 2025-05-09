
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';

// Import refactored components
import UserTable from './UserTable';
import UserFormDialog from './UserFormDialog';
import UserDeleteDialog from './UserDeleteDialog';
import PasswordChangeDialog from './PasswordChangeDialog';

// Define custom Admin User type to match our expectations
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

// Mock users for display with extended properties
const mockUsers: AdminUser[] = [
  {
    id: "1",
    name: "Administrator",
    email: "admin@polygongroup.com",
    role: "administrator",
    phone: "+45 12 34 56 78",
    jobTitle: "Driftansvarlig"
  },
  {
    id: "2",
    name: "Skadeleder",
    email: "skadeleder@polygongroup.com",
    role: "skadeleder",
    phone: "+45 23 45 67 89",
    jobTitle: "Skadeleder"
  },
  {
    id: "3",
    name: "Servicemedarbejder",
    email: "service@polygongroup.com",
    role: "servicemedarbejder",
    phone: "+45 34 56 78 90",
    jobTitle: "Servicemedarbejder"
  },
  {
    id: "4",
    name: "John Doe",
    email: "john.doe@polygongroup.com",
    role: "servicemedarbejder",
    phone: "+45 45 67 89 01",
    jobTitle: "Servicemedarbejde"
  },
  {
    id: "5",
    name: "Jane Smith",
    email: "jane.smith@polygongroup.com",
    role: "skadeleder",
    phone: "+45 56 78 90 12",
    jobTitle: "Fugttekniker"
  },
];

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder' as UserRole,
  });

  // Helper function to get role label
  const getRoleLabel = (role: UserRole): string => {
    return t(`admin.roles.${role}`);
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleCreateUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder',
    });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      jobTitle: user.jobTitle || '',
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: AdminUser) => {
    setCurrentUser(user);
    setPasswordDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (currentUser) {
      setUsers(users.filter(user => user.id !== currentUser.id));
      toast({
        title: t('admin.userManagement.userDeleted'),
        description: t('admin.userManagement.userDeletedMsg', { name: currentUser.name }),
      });
      setDeleteDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole,
    }));
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUser) {
      // Update existing
      setUsers(
        users.map((u) =>
          u.id === currentUser.id ? { ...u, ...formData } : u
        )
      );
      toast({
        title: t('admin.userManagement.userUpdated'),
        description: t('admin.userManagement.userUpdateMsg', { name: formData.name }),
      });
    } else {
      // Create new
      const newUser: AdminUser = {
        ...formData,
        id: Date.now().toString(),
      };
      setUsers([...users, newUser]);
      toast({
        title: t('admin.userManagement.userAdded'),
        description: t('admin.userManagement.userAddedMsg', {
          name: formData.name, 
          role: getRoleLabel(formData.role)
        }),
      });
    }
    
    setUserDialogOpen(false);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.userManagement.title')}</CardTitle>
              <CardDescription>{t('admin.userManagement.description')}</CardDescription>
            </div>
            <Button 
              onClick={handleCreateUser}
              className="bg-polygon-blue hover:bg-polygon-darkblue"
            >
              {t('admin.userManagement.addUser')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable 
            users={users}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            getRoleLabel={getRoleLabel}
            getInitials={getInitials}
          />
        </CardContent>
      </Card>

      {/* User Add/Edit Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <UserFormDialog 
          currentUser={currentUser}
          formData={formData}
          handleInputChange={handleInputChange}
          handleRoleChange={handleRoleChange}
          handleSubmit={handleSubmitUser}
          onClose={() => setUserDialogOpen(false)}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <UserDeleteDialog 
          currentUser={currentUser}
          onConfirmDelete={confirmDeleteUser}
        />
      </AlertDialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <PasswordChangeDialog
          currentUser={currentUser}
          onClose={() => setPasswordDialogOpen(false)}
        />
      </Dialog>
    </>
  );
};

export default UserManagement;
