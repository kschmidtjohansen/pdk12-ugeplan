
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
import { useTranslation } from '@/context/TranslationContext';
import { AdminUser } from './UserTableRow';

interface UserDeleteDialogProps {
  currentUser: AdminUser | null;
  onConfirmDelete: () => void;
  isDeleting?: boolean;
}

const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  currentUser,
  onConfirmDelete,
  isDeleting = false,
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('admin.userManagement.deleteConfirm')}</AlertDialogTitle>
        <AlertDialogDescription>
          {currentUser && (
            <>
              {t('admin.userManagement.deleteWarning', { name: currentUser.name })}
            </>
          )}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isDeleting}>
          {t('common.cancel')}
        </AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirmDelete}
          disabled={isDeleting}
          className="bg-destructive hover:bg-destructive/90"
        >
          {isDeleting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              {t('common.deleting')}
            </div>
          ) : (
            t('common.delete')
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default UserDeleteDialog;
