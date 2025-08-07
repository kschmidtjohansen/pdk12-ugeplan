
import React, { useState } from 'react';
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
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { validateAndSanitizePhone, getPhoneValidationError } from '@/utils/phoneValidation';

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
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [creationMethod, setCreationMethod] = useState<'attempting' | 'edge-function' | 'direct-database' | 'failed'>('attempting');

  // Handle checkbox change if no specific handler is provided
  const onCheckboxChange = (field: string, checked: boolean) => {
    if (handleCheckboxChange) {
      handleCheckboxChange(field, checked);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setPhoneError('');
    setCreationMethod('attempting');
    
    try {
      // Validate phone number first
      const phoneValidation = validateAndSanitizePhone(formData.phone);
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || 'Invalid phone number');
        setIsSubmitting(false);
        return;
      }
      
      // For new employees, validate password
      if (!currentEmployee) {
        if (!isPasswordValid) {
          setErrorMessage(t('employees.passwordRequirements'));
          setIsSubmitting(false);
          return;
        }
        
        // Add password to form data for creation
        const enhancedFormData = {
          ...formData,
          password: password
        };
        
        console.log('[EmployeeFormDialog] Creating employee with enhanced form data');
        
        // The actual creation will be handled by the parent component
        // but we'll track the method being used
        await handleSubmit(e);
      } else {
        // For existing employees, just update
        await handleSubmit(e);
      }
      
    } catch (error) {
      console.error('[EmployeeFormDialog] Form submission error:', error);
      
      let errorMsg = t('employees.unexpectedError');
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setCreationMethod('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConnectionStatus = () => {
    if (!isSubmitting) return null;
    
    switch (creationMethod) {
      case 'attempting':
        return (
          <Alert className="mb-4">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              {t('employees.creatingUserDescription')}
            </AlertDescription>
          </Alert>
        );
      case 'edge-function':
        return (
          <Alert className="mb-4">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              {t('employees.userCreatedSuccessfully')}
            </AlertDescription>
          </Alert>
        );
      case 'direct-database':
        return (
          <Alert className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {t('employees.userCreatedFallback')}
            </AlertDescription>
          </Alert>
        );
      case 'failed':
        return (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('employees.userCreationFailed')}
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
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
      
      <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
        <div className="grid gap-4">
          {getConnectionStatus()}
          
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {phoneError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {phoneError}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="name">{t("employees.fullName")}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting || !!currentEmployee}
            />
          </div>
          
          {!currentEmployee && (
            <div className="grid gap-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
                showStrengthIndicator={true}
                onValidationChange={setIsPasswordValid}
              />
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="phone">{t("employees.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                handleInputChange(e);
                setPhoneError(''); // Clear error on change
              }}
              disabled={isSubmitting}
              placeholder="e.g., +45 12 34 56 78"
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
              disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
              disabled={isSubmitting}
              className={isSkadeleder && !isAdmin ? "bg-gray-100" : ""}
            />
            {isSkadeleder && !isAdmin && (
              <p className="text-xs text-gray-500">{t('employees.viewNotesOnly')}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || (!currentEmployee && !isPasswordValid)}
          >
            {isSubmitting 
              ? t('common.loading') 
              : currentEmployee
                ? t("common.save")
                : t("common.add")
            }
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EmployeeFormDialog;
