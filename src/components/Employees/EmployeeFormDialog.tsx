
import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { Checkbox } from '@/components/ui/checkbox';

interface EmployeeFormDialogProps {
  currentEmployee: Employee | null;
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string) => void;
  handleCheckboxChange?: (field: string, checked: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  currentEmployee,
  formData,
  handleInputChange,
  handleSelectChange,
  handleCheckboxChange,
  handleSubmit,
  onClose,
}) => {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();

  // Handle checkbox change if no specific handler is provided
  const onCheckboxChange = (field: string, checked: boolean) => {
    if (handleCheckboxChange) {
      handleCheckboxChange(field, checked);
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {currentEmployee ? t("employees.editEmployee") : t("employees.addNewEmployee")}
        </DialogTitle>
        <DialogDescription>
          {currentEmployee ? t("employees.updateInfo") : t("employees.createAccount")}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("employees.fullName")}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">{t("employees.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">{t("employees.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid gap-2">
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
            <>
              <div className="grid gap-2">
                <Label htmlFor="role">{t("employees.role")}</Label>
                <Select
                  name="role"
                  value={formData.role}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.userManagement.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">{t("admin.roles.administrator")}</SelectItem>
                    <SelectItem value="skadeleder">{t("admin.roles.skadeleder")}</SelectItem>
                    <SelectItem value="servicemedarbejder">{t("admin.roles.servicemedarbejder")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox 
                  id="onLeave"
                  checked={formData.onLeave}
                  onCheckedChange={(checked) => onCheckboxChange('onLeave', checked === true)}
                />
                <Label htmlFor="onLeave">{t('employees.onLeave')}</Label>
              </div>
            </>
          )}
          
          {/* Notes field - viewable by skadeleder but only editable by admin */}
          <div className="grid gap-2">
            <Label htmlFor="notes">{t("employees.notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder={t("employees.notesPlaceholder")}
              readOnly={isSkadeleder && !isAdmin}
              className={isSkadeleder && !isAdmin ? "bg-gray-100" : ""}
            />
            {isSkadeleder && !isAdmin && (
              <p className="text-xs text-gray-500">{t('employees.viewNotesOnly')}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit">
            {currentEmployee ? t("common.save") : t("common.add")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EmployeeFormDialog;
