
import React, { useState, useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { useTranslation } from '../../context/TranslationContext';
import UserTable from './UserTable';
import UserFormDialog from './UserFormDialog';
import UserDeleteDialog from './UserDeleteDialog';
import PasswordChangeDialog from './PasswordChangeDialog';
import { authService } from '../../services/authService';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import type { UserRole } from '../../context/AuthContext';

// User form data type
interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// User type from API
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const UserManagementContainer = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'servicemedarbejder'
  });
  
  const { toast } = useToast();
  const { t } = useTranslation();

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // Fetch all users from the database
        const { data: usersData, error } = await authService.listUsers();
        
        if (error) throw error;
        
        if (usersData) {
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Failed to load users', error);
        toast({
          variant: 'destructive',
          title: t('admin.errorLoadingUsers'),
          description: t('admin.errorGeneric')
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [toast, t]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t('admin.userManagement')}</h2>
        <Button onClick={() => {
          setCurrentUser(null);
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'servicemedarbejder'
          });
          setFormDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> {t('admin.addUser')}
        </Button>
      </div>
      
      <UserTable 
        users={users} 
        loading={loading} 
        onEdit={(user) => {
          setCurrentUser(user);
          setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role
          });
          setFormDialogOpen(true);
        }}
        onDelete={(user) => {
          setCurrentUser(user);
          setDeleteDialogOpen(true);
        }}
        onChangePassword={(user) => {
          setCurrentUser(user);
          setPasswordDialogOpen(true);
        }}
      />
      
      {/* Dialogs */}
      <UserFormDialog 
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        currentUser={currentUser}
        formData={formData}
        setFormData={setFormData}
        onSubmit={async (data) => {
          try {
            if (currentUser) {
              // Update existing user
              await authService.updateUser(currentUser.id, data);
              
              // Update local state
              setUsers(users.map(u => 
                u.id === currentUser.id 
                  ? { ...u, name: data.name, email: data.email, role: data.role } 
                  : u
              ));
              
              toast({
                title: t('admin.userUpdated'),
                description: t('admin.userUpdatedDesc', { name: data.name })
              });
            } else {
              // Create new user
              const newUser = await authService.createUser(data);
              
              // Update local state
              if (newUser) {
                setUsers([...users, newUser]);
              }
              
              toast({
                title: t('admin.userCreated'),
                description: t('admin.userCreatedDesc', { name: data.name })
              });
            }
            
            setFormDialogOpen(false);
          } catch (error) {
            console.error('Error saving user', error);
            toast({
              variant: 'destructive',
              title: t('admin.errorSavingUser'),
              description: t('admin.errorGeneric')
            });
          }
        }}
      />
      
      <UserDeleteDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={currentUser}
        onConfirm={async () => {
          if (!currentUser) return;
          
          try {
            await authService.deleteUser(currentUser.id);
            
            // Update local state
            setUsers(users.filter(u => u.id !== currentUser.id));
            
            toast({
              title: t('admin.userDeleted'),
              description: t('admin.userDeletedDesc', { name: currentUser.name })
            });
            
            setDeleteDialogOpen(false);
          } catch (error) {
            console.error('Error deleting user', error);
            toast({
              variant: 'destructive',
              title: t('admin.errorDeletingUser'),
              description: t('admin.errorGeneric')
            });
          }
        }}
      />
      
      <PasswordChangeDialog 
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        user={currentUser}
        onConfirm={async (password) => {
          if (!currentUser) return;
          
          try {
            await authService.resetUserPassword(currentUser.id, password);
            
            toast({
              title: t('admin.passwordChanged'),
              description: t('admin.passwordChangedDesc', { name: currentUser.name })
            });
            
            setPasswordDialogOpen(false);
          } catch (error) {
            console.error('Error changing password', error);
            toast({
              variant: 'destructive',
              title: t('admin.errorChangingPassword'),
              description: t('admin.errorGeneric')
            });
          }
        }}
      />
    </div>
  );
};

export default UserManagementContainer;
