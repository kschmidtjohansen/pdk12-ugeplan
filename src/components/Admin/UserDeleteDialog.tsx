
import React from 'react';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { useTranslation } from '@/context/TranslationContext';

interface UserDeleteDialogProps {
  currentUser: (User & Partial<Employee>) | null;
  onConfirmDelete: () => void;
}

const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  currentUser,
  onConfirmDelete,
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('admin.userManagement.deleteConfirm')}</AlertDialogTitle>
        <AlertDialogDescription>
          {currentUser && (
            <>
              {t('admin.userManagement.deleteWarning', { name: <strong>{currentUser.name}</strong> })}
            </>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirmDelete}
          className="bg-destructive hover:bg-destructive/90"
        >
          {t('common.delete')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default UserDeleteDialog;
