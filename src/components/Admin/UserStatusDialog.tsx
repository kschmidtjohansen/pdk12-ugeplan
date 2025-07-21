
import React from 'react';
import {
  AlertDialog,
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

interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: () => void;
  isActivating: boolean;
}

const UserStatusDialog: React.FC<UserStatusDialogProps> = ({
  open,
  onOpenChange,
  user,
  onConfirm,
  isActivating,
}) => {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActivating 
              ? t('admin.userManagement.confirmActivate', { name: user.name })
              : t('admin.userManagement.confirmDeactivate', { name: user.name })
            }
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActivating 
              ? t('admin.userManagement.userActivatedMsg', { name: user.name })
              : t('admin.userManagement.deactivateWarning')
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('planner.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isActivating 
              ? t('admin.userManagement.activateUser')
              : t('admin.userManagement.deactivateUser')
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserStatusDialog;
