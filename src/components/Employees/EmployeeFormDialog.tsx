import React, { useState, useEffect } from 'react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth, usePermissions } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, Wifi, WifiOff, Calendar, CalendarPlus, UserCheck } from 'lucide-react';
import { validateAndSanitizePhone } from '@/utils/phoneValidation';
import { format, addWeeks, addMonths, startOfToday } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
interface EmployeeFormDialogProps {
  currentEmployee: Employee | null;
  formData: any;
  creationType: 'employee' | 'vikar' | 'edit';
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string) => void;
  handleRoleToggle?: (role: string, checked: boolean) => void;
  handleCheckboxChange?: (field: string, checked: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}
const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  currentEmployee,
  formData,
  creationType,
  handleInputChange,
  handleSelectChange,
  handleRoleToggle,
  handleCheckboxChange,
  handleSubmit,
  onClose
}) => {
  const {
    t
  } = useTranslation();
  const dateLocale = useDateLocale();
  const {
    isAdmin,
    isSkadeleder
  } = usePermissions();
  const { user: authUser } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const isSuperAdmin = authUser?.role === 'super_admin';
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [creationMethod, setCreationMethod] = useState<CreationMethod>('attempting');
  const [showOnLeaveConfirm, setShowOnLeaveConfirm] = useState(false);
  const [convertToPermanent, setConvertToPermanent] = useState(false);
  const { emailCheck, setEmailCheck, runEmailCheck, emailStatusLabel } = useEmailCheck(currentEmployee, formData.email);

  // Check if we're editing a temporary employee
  const isEditingVikar = creationType === 'edit' && currentEmployee?.is_temporary === true;


  // Load existing sub_department_id for the employee being edited
  useEffect(() => {
    if (!currentEmployee?.id || !selectedDepartmentId) return;
    (async () => {
      const { data } = await supabase
        .from('user_access')
        .select('sub_department_id')
        .eq('user_id', currentEmployee.id)
        .eq('department_id', selectedDepartmentId)
        .maybeSingle();
      const current = (data as any)?.sub_department_id ?? null;
      handleInputChange({ target: { name: 'sub_department_id', value: current ?? '' } } as any);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployee?.id, selectedDepartmentId]);

  // Auto-set password validation to true for temporary users
  useEffect(() => {
    if (formData.is_temporary) {
      setIsPasswordValid(true);
    }
  }, [formData.is_temporary]);

  // When convert to permanent is toggled, update formData
  useEffect(() => {
    if (convertToPermanent && isEditingVikar) {
      onCheckboxChange('is_temporary', false);
      handleInputChange({
        target: { name: 'expires_at', value: '' }
      } as any);
    } else if (!convertToPermanent && isEditingVikar) {
      onCheckboxChange('is_temporary', true);
    }
  }, [convertToPermanent]);

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
      // Postcode validation
      if (formData.home_postcode && !/^\d{4}$/.test(formData.home_postcode)) {
        setErrorMessage(t('employees.postcodeInvalid'));
        setIsSubmitting(false);
        return;
      }

      // Vikar expiry must be in the future and not before the current expiry.
      // Only validated when the date is actually changed, so an already expired
      // vikar can still be edited (phone, address, ...) without extending.
      const storedExpiry = currentEmployee?.expires_at
        ? new Date(currentEmployee.expires_at).toISOString().split('T')[0]
        : '';
      const expiryChanged = formData.expires_at !== storedExpiry;
      if (isEditingVikar && !convertToPermanent && formData.expires_at && expiryChanged) {
        const expiry = new Date(formData.expires_at);
        if (isNaN(expiry.getTime()) || expiry < startOfToday()) {
          setErrorMessage(t('employees.expirationMustBeFuture'));
          setIsSubmitting(false);
          return;
        }
        if (currentEmployee?.expires_at) {
          const currentExpiry = new Date(currentEmployee.expires_at);
          currentExpiry.setHours(0, 0, 0, 0);
          if (expiry < currentExpiry) {
            setErrorMessage(t('employees.expiryBeforeCurrent', {
              date: format(currentExpiry, 'd. MMMM yyyy', { locale: dateLocale })
            }));
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Phone validation - only required for non-temporary users
      if (!formData.is_temporary && formData.phone) {
        const phoneValidation = validateAndSanitizePhone(formData.phone);
        if (!phoneValidation.valid) {
          setPhoneError(phoneValidation.error || 'Invalid phone number');
          setIsSubmitting(false);
          return;
        }
      }

      // For new employees, validate password (skip for temporary users)
      if (!currentEmployee && !formData.is_temporary) {
        if (emailCheck.state === 'done' && emailCheck.status && emailCheck.status !== 'available') {
          setErrorMessage(
            emailCheck.status === 'auth_only'
              ? t('employees.emailAuthOnly')
              : emailCheck.status === 'active'
                ? t('employees.emailTakenActive', { name: emailCheck.name || formData.email })
                : t('employees.emailTakenInactive', {
                    name: emailCheck.name || formData.email,
                    status: emailStatusLabel(emailCheck.profileStatus),
                  })
          );
          setIsSubmitting(false);
          return;
        }
        if (!isPasswordValid) {
          setErrorMessage(t('employees.passwordRequirements'));
          setIsSubmitting(false);
          return;
        }

        if (import.meta.env.DEV) console.log('[EmployeeFormDialog] Creating employee');
        // The actual creation will be handled by the parent component using formData (including password)
        await handleSubmit(e);
      } else {
        // For existing employees, just update
        await handleSubmit(e);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[EmployeeFormDialog] Form submission error:', error);
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
  return <>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {creationType === 'edit' ? t("employees.editEmployee") : 
           creationType === 'vikar' ? t("employees.addVikar") : 
           t("employees.addNewEmployee")}
        </DialogTitle>
        <DialogDescription>
          {creationType === 'edit' ? t("employees.updateInfo") : t("employees.createAccount")}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
        <div className="grid gap-4">
          <ConnectionStatus isSubmitting={isSubmitting} creationMethod={creationMethod} />
          
          {errorMessage && <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>}
          
          {phoneError && <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {phoneError}
              </AlertDescription>
            </Alert>}
          
          <div className="grid gap-2">
            <Label htmlFor="name">{t("employees.fullName")}</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isSubmitting} />
          </div>
          
          <EmailField formData={formData} handleInputChange={handleInputChange} currentEmployee={currentEmployee} isEditingVikar={isEditingVikar} convertToPermanent={convertToPermanent} isSubmitting={isSubmitting} emailCheck={emailCheck} setEmailCheck={setEmailCheck} runEmailCheck={runEmailCheck} emailStatusLabel={emailStatusLabel} />

          
          {!currentEmployee && !formData.is_temporary && <div className="grid gap-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <PasswordInput id="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={isSubmitting} autoComplete="new-password" showStrengthIndicator={true} onValidationChange={setIsPasswordValid} />
            </div>}
          
          <div className="grid gap-2">
            <Label htmlFor="phone">
              {formData.is_temporary ? t('employees.phoneOptional') : t("employees.phone")}
            </Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={e => {
            handleInputChange(e);
            setPhoneError(''); // Clear error on change
          }} required={!formData.is_temporary} disabled={isSubmitting} placeholder={formData.is_temporary ? "12 34 56 78 (valgfri)" : "e.g., +45 12 34 56 78"} />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="jobTitle">{t("employees.jobTitle")}</Label>
            <Input 
              id="jobTitle" 
              name="jobTitle" 
              value={formData.jobTitle} 
              onChange={handleInputChange} 
              disabled={isSubmitting}
              placeholder={t("employees.jobTitlePlaceholder")}
            />
          </div>
          
          {/* Postcode - Admin only */}
          {isAdmin && (
            <div className="grid gap-2">
              <Label htmlFor="home_postcode">{t("employees.homePostcode")}</Label>
              <Input 
                id="home_postcode" 
                name="home_postcode" 
                value={formData.home_postcode || ''} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  handleInputChange({
                    target: { name: 'home_postcode', value: val }
                  } as any);
                }}
                maxLength={4}
                inputMode="numeric"
                placeholder="7000"
                disabled={isSubmitting}
                className="w-[120px]"
              />
            </div>
          )}

          {/* Certificates Section */}
          <CertificatesSection formData={formData} onCheckboxChange={onCheckboxChange} isSubmitting={isSubmitting} />
          
          {isAdmin && <>
              {/* Vikar conversion section - only show when editing a vikar */}
              {isEditingVikar && (
                <VikarConversionSection currentEmployee={currentEmployee} formData={formData} handleInputChange={handleInputChange} convertToPermanent={convertToPermanent} setConvertToPermanent={setConvertToPermanent} isSubmitting={isSubmitting} />
              )}

              {/* Temporary user checkbox - only show when creating vikar, not when editing */}
              {creationType === 'vikar' && (
                <NewVikarSection formData={formData} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} onCheckboxChange={onCheckboxChange} setErrorMessage={setErrorMessage} isSubmitting={isSubmitting} />
              )}

              <RoleSection formData={formData} convertToPermanent={convertToPermanent} isSuperAdmin={isSuperAdmin} handleRoleToggle={handleRoleToggle} handleSelectChange={handleSelectChange} onCheckboxChange={onCheckboxChange} isSubmitting={isSubmitting} />

              {/* Skip department checkbox - visible when role is super_admin */}
              {formData.role === 'super_admin' && !formData.is_temporary && (
                <div className="space-y-2 p-3 bg-info-soft border border-info/30 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="skip_department" 
                      checked={formData.skip_department} 
                      onCheckedChange={checked => onCheckboxChange('skip_department', checked as boolean)} 
                      disabled={isSubmitting} 
                    />
                    <Label htmlFor="skip_department" className="text-sm font-medium cursor-pointer">
                      {t('employees.skipDepartment')}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {t('employees.skipDepartmentNote')}
                  </p>
                </div>
              )}
              
              {(!formData.is_temporary || convertToPermanent) && <div className="flex items-center space-x-2 mt-4">
                  <Checkbox id="onLeave" checked={formData.onLeave} onCheckedChange={checked => {
                    // Turning ON leave requires confirmation so the effect on assignments is clear.
                    // Turning OFF applies immediately.
                    if (checked === true && !formData.onLeave) {
                      setShowOnLeaveConfirm(true);
                    } else {
                      onCheckboxChange('onLeave', checked === true);
                    }
                  }} disabled={isSubmitting} />
                  <Label htmlFor="onLeave">{t('employees.onLeave')}</Label>
                </div>}

              {/* Sub-department assignment — strict isolation when set */}
              {!formData.is_temporary && formData.role !== 'super_admin' && (
                <SubDepartmentField departmentId={selectedDepartmentId} formData={formData} handleInputChange={handleInputChange} isSubmitting={isSubmitting} />
              )}
            </>}
          
          {/* Notes field - viewable by skadeleder but only editable by admin */}
          <div className="grid gap-2">
            <Label htmlFor="notes">{t("employees.notes")}</Label>
            <Textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} placeholder={t("employees.notesPlaceholder")} readOnly={isSkadeleder && !isAdmin} disabled={isSubmitting} className={isSkadeleder && !isAdmin ? "bg-muted" : ""} />
            {isSkadeleder && !isAdmin && <p className="text-xs text-muted-foreground">{t('employees.viewNotesOnly')}</p>}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting || (!currentEmployee && !formData.is_temporary && !isPasswordValid)}>
            {isSubmitting ? t('common.loading') : currentEmployee ? t("common.save") : t("common.add")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
    <AlertDialog open={showOnLeaveConfirm} onOpenChange={setShowOnLeaveConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('employees.onLeaveConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('employees.onLeaveConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            onCheckboxChange('onLeave', true);
            setShowOnLeaveConfirm(false);
          }}>
            {t('employees.onLeaveConfirmAction')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
};
export default EmployeeFormDialog;