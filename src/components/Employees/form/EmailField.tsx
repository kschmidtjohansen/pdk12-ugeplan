import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/TranslationContext';
import type { Employee } from '@/types/employee';
import type { EmployeeFormData, InputChangeHandler } from './types';
import type { EmailCheckState } from './useEmailCheck';

interface Props {
  formData: EmployeeFormData;
  handleInputChange: InputChangeHandler;
  currentEmployee: Employee | null;
  isEditingVikar: boolean;
  convertToPermanent: boolean;
  isSubmitting: boolean;
  emailCheck: EmailCheckState;
  setEmailCheck: (s: EmailCheckState) => void;
  runEmailCheck: () => void;
  emailStatusLabel: (profileStatus?: string) => string;
}

const EmailField: React.FC<Props> = ({
  formData, handleInputChange, currentEmployee, isEditingVikar, convertToPermanent, isSubmitting,
  emailCheck, setEmailCheck, runEmailCheck, emailStatusLabel,
}) => {
  const { t } = useTranslation();
  return (
          <div className="grid gap-2">
            <Label htmlFor="email">
              {formData.is_temporary && !convertToPermanent ? t('employees.emailOptional') : t("employees.email")}
            </Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={(e) => { handleInputChange(e); setEmailCheck({ state: 'idle' }); }} 
              onBlur={runEmailCheck}
              required={!formData.is_temporary || convertToPermanent} 
              disabled={isSubmitting || (!!currentEmployee && !isEditingVikar)} 
              placeholder={formData.is_temporary && !convertToPermanent ? "vikar@firma.dk (valgfri)" : "medarbejder@firma.dk"} 
            />
            {!currentEmployee && emailCheck.state === 'checking' && (
              <p className="text-xs text-muted-foreground">{t('employees.emailChecking')}</p>
            )}
            {!currentEmployee && emailCheck.state === 'error' && (
              <p className="text-xs text-muted-foreground">{t('employees.emailCheckFailed')}</p>
            )}
            {!currentEmployee && emailCheck.state === 'done' && emailCheck.status === 'available' && (
              <p className="text-xs text-success-soft-foreground">{t('employees.emailAvailable')}</p>
            )}
            {!currentEmployee && emailCheck.state === 'done' && emailCheck.status === 'active' && (
              <p className="text-xs text-destructive">
                {t('employees.emailTakenActive', { name: emailCheck.name || formData.email })}
              </p>
            )}
            {!currentEmployee && emailCheck.state === 'done' && emailCheck.status === 'inactive' && (
              <p className="text-xs text-destructive">
                {t('employees.emailTakenInactive', {
                  name: emailCheck.name || formData.email,
                  status: emailStatusLabel(emailCheck.profileStatus),
                })}
              </p>
            )}
            {!currentEmployee && emailCheck.state === 'done' && emailCheck.status === 'auth_only' && (
              <p className="text-xs text-destructive">{t('employees.emailAuthOnly')}</p>
            )}
          </div>
  );
};

export default EmailField;
