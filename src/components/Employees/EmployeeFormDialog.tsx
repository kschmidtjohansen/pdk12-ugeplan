
import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { usePermissions } from '../../context/AuthContext';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Employee } from './EmployeesList';

interface USER_ROLES_TYPE {
  value: string;
  label: string;
}

const USER_ROLES: USER_ROLES_TYPE[] = [{
  value: 'administrator',
  label: 'Administrator'
}, {
  value: 'skadeleder',
  label: 'Skadeleder'
}, {
  value: 'servicemedarbejder',
  label: 'Servicemedarbejder'
}];

interface FormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: string;
  onLeave?: boolean;
  notes?: string;
}

interface EmployeeFormDialogProps {
  currentEmployee: Employee | null;
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  currentEmployee,
  formData,
  handleInputChange,
  handleSelectChange,
  handleSubmit,
  onClose
}) => {
  const { t } = useTranslation();
  const { isAdmin } = usePermissions();

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {currentEmployee ? t("employees.editEmployee") : t("employees.addNewEmployee")}
        </DialogTitle>
        <DialogDescription>
          {currentEmployee ? t("employees.updateInfo") : t("employees.createAccount")}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("employees.fullName")}</Label>
          <Input 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleInputChange} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
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
          <Label htmlFor="phone">{t("employees.phone")}</Label>
          <Input 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleInputChange} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="jobTitle">{t("employees.jobTitle")}</Label>
          <Input 
            id="jobTitle" 
            name="jobTitle" 
            value={formData.jobTitle} 
            onChange={handleInputChange} 
            required 
          />
        </div>
        
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="role">{t("employees.role")}</Label>
            <Select value={formData.role} onValueChange={handleSelectChange} required>
              <SelectTrigger id="role">
                <SelectValue placeholder={t("admin.userManagement.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="onLeave"
            name="onLeave"
            checked={formData.onLeave || false}
            onCheckedChange={(checked) => {
              const event = {
                target: {
                  name: 'onLeave',
                  type: 'checkbox',
                  checked: !!checked
                }
              } as React.ChangeEvent<HTMLInputElement>;
              handleInputChange(event);
            }}
          />
          <Label htmlFor="onLeave" className="text-sm font-normal">
            {t("employees.onLeave")}
          </Label>
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="notes">{t("employees.notes")}</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              value={formData.notes || ''} 
              onChange={handleInputChange} 
              placeholder={t("employees.notesPlaceholder")}
              rows={3}
            />
          </div>
        )}
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit" 
            className="bg-polygon-blue hover:bg-polygon-darkblue"
          >
            {currentEmployee ? t("common.save") : t("common.add")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EmployeeFormDialog;
