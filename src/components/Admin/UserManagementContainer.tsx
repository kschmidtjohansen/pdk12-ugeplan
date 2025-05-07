
import React from 'react';
import { useUserManagement } from '../../hooks/useUserManagement';
import UserTable from './UserTable';
import UserFormDialog from './UserFormDialog';
import UserDeleteDialog from './UserDeleteDialog';
import PasswordChangeDialog from './PasswordChangeDialog';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { Dialog } from '../ui/dialog';
import { AlertDialog } from '../ui/alert-dialog';
import ErrorBoundary from '../ErrorBoundary';
import { useTranslation } from '../../context/TranslationContext';

const UserManagementContainer = () => {
  const { t } = useTranslation();
  const {
    users,
    loading,
    formDialogOpen,
    setFormDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    passwordDialogOpen,
    setPasswordDialogOpen,
    currentUser,
    formData,
    handleInputChange,
    handleRoleChange,
    handleSubmit,
    handleAddNewUser,
    handleEditUser,
    handleDeleteUser,
    handleResetPassword,
    confirmDeleteUser,
    confirmPasswordChange,
    getRoleLabel,
    getInitials
  } = useUserManagement();

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{t('admin.userManagement')}</h2>
          <Button onClick={handleAddNewUser}>
            <Plus className="mr-2 h-4 w-4" /> {t('admin.addUser')}
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <UserTable 
            users={users} 
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            getRoleLabel={getRoleLabel}
            getInitials={getInitials}
          />
        )}
        
        {/* Dialogs */}
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <UserFormDialog 
            currentUser={currentUser}
            formData={formData}
            handleInputChange={handleInputChange}
            handleRoleChange={handleRoleChange}
            handleSubmit={handleSubmit}
            onClose={() => setFormDialogOpen(false)}
          />
        </Dialog>
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <UserDeleteDialog 
            currentUser={currentUser}
            onConfirmDelete={confirmDeleteUser}
          />
        </AlertDialog>
        
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <PasswordChangeDialog 
            userId={currentUser?.id || ''}
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
            onConfirm={confirmPasswordChange}
          />
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default UserManagementContainer;
