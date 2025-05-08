
import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, UserRole } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { useTranslation } from '@/context/TranslationContext';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
}

interface UserFormDialogProps {
  currentUser: (User & Partial<Employee>) | null;
  formData: UserFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRoleChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  currentUser,
  formData,
  handleInputChange,
  handleRoleChange,
  handleSubmit,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {currentUser ? t('admin.userManagement.editUser') : t('admin.userManagement.addNewUser')}
        </DialogTitle>
        <DialogDescription>
          {currentUser
            ? t('admin.userManagement.updateInfo')
            : t('admin.userManagement.createAccount')}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('admin.userManagement.fullName')}</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">{t('common.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">{t('employees.phone')}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="jobTitle">{t('employees.jobTitle')}</Label>
          <Input
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">{t('admin.userManagement.role')}</Label>
          <Select
            value={formData.role}
            onValueChange={handleRoleChange}
            required
          >
            <SelectTrigger id="role">
              <SelectValue placeholder={t('admin.userManagement.selectRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="administrator">
                {t('admin.roles.administrator')}
              </SelectItem>
              <SelectItem value="skadeleder">
                {t('admin.roles.skadeleder')}
              </SelectItem>
              <SelectItem value="servicemedarbejder">
                {t('admin.roles.servicemedarbejder')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit"
            className="bg-polygon-blue hover:bg-polygon-darkblue"
          >
            {currentUser ? t('common.save') : t('common.add')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default UserFormDialog;
