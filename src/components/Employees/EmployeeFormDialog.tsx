import React, { useState, useEffect } from 'react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth, usePermissions } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from '@/components/ui/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff, Calendar, UserCheck } from 'lucide-react';
import { validateAndSanitizePhone } from '@/utils/phoneValidation';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
interface EmployeeFormDialogProps {
  currentEmployee: Employee | null;
  formData: any;
  creationType: 'employee' | 'vikar' | 'edit';
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string) => void;
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
  handleCheckboxChange,
  handleSubmit,
  onClose
}) => {
  const {
    t
  } = useTranslation();
  const {
    isAdmin,
    isSkadeleder
  } = usePermissions();
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === 'super_admin';
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [creationMethod, setCreationMethod] = useState<'attempting' | 'edge-function' | 'direct-database' | 'failed'>('attempting');
  const [convertToPermanent, setConvertToPermanent] = useState(false);

  // Check if we're editing a temporary employee
  const isEditingVikar = creationType === 'edit' && currentEmployee?.is_temporary === true;

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
  const getConnectionStatus = () => {
    if (!isSubmitting) return null;
    switch (creationMethod) {
      case 'attempting':
        return <Alert className="mb-4">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              {t('employees.creatingUserDescription')}
            </AlertDescription>
          </Alert>;
      case 'edge-function':
        return <Alert className="mb-4">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              {t('employees.userCreatedSuccessfully')}
            </AlertDescription>
          </Alert>;
      case 'direct-database':
        return <Alert className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {t('employees.userCreatedFallback')}
            </AlertDescription>
          </Alert>;
      case 'failed':
        return <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('employees.userCreationFailed')}
            </AlertDescription>
          </Alert>;
      default:
        return null;
    }
  };
  return <DialogContent className="sm:max-w-[425px]">
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
          {getConnectionStatus()}
          
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
          
          <div className="grid gap-2">
            <Label htmlFor="email">
              {formData.is_temporary && !convertToPermanent ? t('employees.emailOptional') : t("employees.email")}
            </Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              required={!formData.is_temporary || convertToPermanent} 
              disabled={isSubmitting || (!!currentEmployee && !isEditingVikar)} 
              placeholder={formData.is_temporary && !convertToPermanent ? "vikar@firma.dk (valgfri)" : "medarbejder@firma.dk"} 
            />
          </div>
          
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
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-semibold">
              {t('employees.certificatesSection')}
            </Label>
            <div className="space-y-3 pl-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_asbestos_certificate" 
                  checked={formData.has_asbestos_certificate} 
                  onCheckedChange={checked => onCheckboxChange('has_asbestos_certificate', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_asbestos_certificate" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasAsbestosCertificate')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_pcb_certificate" 
                  checked={formData.has_pcb_certificate} 
                  onCheckedChange={checked => onCheckboxChange('has_pcb_certificate', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_pcb_certificate" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasPcbCertificate')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_trailer_license" 
                  checked={formData.has_trailer_license} 
                  onCheckedChange={checked => onCheckboxChange('has_trailer_license', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_trailer_license" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasTrailerLicense')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has_forklift_license" 
                  checked={formData.has_forklift_license} 
                  onCheckedChange={checked => onCheckboxChange('has_forklift_license', checked as boolean)} 
                  disabled={isSubmitting} 
                />
                <Label htmlFor="has_forklift_license" className="text-sm font-normal cursor-pointer">
                  {t('employees.hasForkliftLicense')}
                </Label>
              </div>
            </div>
          </div>
          
          {isAdmin && <>
              {/* Vikar conversion section - only show when editing a vikar */}
              {isEditingVikar && (
                <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="flex items-start space-x-2">
                    <UserCheck className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {t('employees.currentlyVikar')}
                      </p>
                      {currentEmployee?.expires_at && !convertToPermanent && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {t('employees.vikarExpiresInfo', { 
                            date: format(new Date(currentEmployee.expires_at), 'd. MMMM yyyy', { locale: da })
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                    <Checkbox 
                      id="convertToPermanent" 
                      checked={convertToPermanent} 
                      onCheckedChange={(checked) => setConvertToPermanent(checked as boolean)} 
                      disabled={isSubmitting} 
                    />
                    <Label htmlFor="convertToPermanent" className="text-sm font-medium cursor-pointer">
                      {t('employees.convertToPermanent')}
                    </Label>
                  </div>
                  {convertToPermanent && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 pl-6">
                      {t('employees.convertToPermanentNote')}
                    </p>
                  )}
                </div>
              )}

              {/* Temporary user checkbox - only show when creating vikar, not when editing */}
              {creationType === 'vikar' && <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="is_temporary" checked={formData.is_temporary} onCheckedChange={checked => {
                onCheckboxChange('is_temporary', checked as boolean);
                // Auto-set expiration date to 30 days from now for new temporary users
                if (checked && !formData.expires_at) {
                  const expirationDate = new Date();
                  expirationDate.setDate(expirationDate.getDate() + 30);
                  handleInputChange({
                    target: {
                      name: 'expires_at',
                      value: expirationDate.toISOString().split('T')[0]
                    }
                  } as any);
                }
                // Auto-set role to vikar for temporary users
                if (checked) {
                  handleSelectChange('vikar');
                }
              }} disabled={isSubmitting} />
                  <Label htmlFor="is_temporary" className="text-sm font-medium">
                    {t('employees.isTemporary')}
                  </Label>
                </div>
                
                {formData.is_temporary && <div className="bg-muted p-3 rounded-md space-y-2">
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="expires_at">{t('employees.expirationDate')}</Label>
                        <Input 
                          id="expires_at" 
                          name="expires_at" 
                          type="date" 
                          value={formData.expires_at} 
                          onChange={(e) => {
                            handleInputChange(e);
                            // Validate expiration date
                            const selectedDate = new Date(e.target.value);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const sixMonthsFromNow = new Date(today);
                            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
                            
                            if (selectedDate < today) {
                              setErrorMessage(t('employees.expirationMustBeFuture'));
                            } else if (selectedDate > sixMonthsFromNow) {
                              setErrorMessage('');
                              // Just a warning, don't prevent submission
                            } else {
                              setErrorMessage('');
                            }
                          }}
                          required={formData.is_temporary} 
                          min={new Date().toISOString().split('T')[0]} 
                          disabled={isSubmitting} 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('employees.temporaryUserNote')}
                    </p>
                    {formData.expires_at && (() => {
                      const selectedDate = new Date(formData.expires_at);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const sixMonthsFromNow = new Date(today);
                      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
                      
                      if (selectedDate > sixMonthsFromNow) {
                        return (
                          <Alert className="py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {t('employees.expirationFarFuture')}
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      return null;
                    })()}
                  </div>}
              </div>}

              <div className="grid gap-2">
                <Label htmlFor="role">{t("employees.role")}</Label>
                <Select 
                  name="role" 
                  value={formData.is_temporary && !convertToPermanent ? 'vikar' : formData.role} 
                  onValueChange={(value: string) => {
                    if (formData.is_temporary && !convertToPermanent) return;
                    handleSelectChange(value);
                    // Auto-enable skip_department when super_admin is selected
                    if (value === 'super_admin') {
                      onCheckboxChange('skip_department', true);
                    }
                  }} 
                  disabled={isSubmitting || (formData.is_temporary && !convertToPermanent)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.userManagement.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">{t("employees.super_admin")}</SelectItem>
                    )}
                    <SelectItem value="administrator">{t("employees.administrator")}</SelectItem>
                    <SelectItem value="skadeleder">{t("employees.skadeleder")}</SelectItem>
                    <SelectItem value="fugttekniker">{t("employees.fugttekniker")}</SelectItem>
                    <SelectItem value="servicemedarbejder">{t("employees.servicemedarbejder")}</SelectItem>
                    <SelectItem value="vikar">{t("employees.vikar")}</SelectItem>
                  </SelectContent>
                </Select>
                {formData.is_temporary && !convertToPermanent && <p className="text-xs text-muted-foreground">
                    {t('employees.vikarAutoRole')}
                  </p>}
              </div>

              {/* Skip department checkbox - visible when role is super_admin */}
              {formData.role === 'super_admin' && !formData.is_temporary && (
                <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
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
                  <Checkbox id="onLeave" checked={formData.onLeave} onCheckedChange={checked => onCheckboxChange('onLeave', checked === true)} disabled={isSubmitting} />
                  <Label htmlFor="onLeave">{t('employees.onLeave')}</Label>
                </div>}
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
    </DialogContent>;
};
export default EmployeeFormDialog;