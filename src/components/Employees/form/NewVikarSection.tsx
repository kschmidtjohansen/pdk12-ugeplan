import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { EmployeeFormData, InputChangeHandler } from './types';

interface Props {
  formData: EmployeeFormData;
  handleInputChange: InputChangeHandler;
  handleSelectChange: (value: string) => void;
  onCheckboxChange: (field: string, checked: boolean) => void;
  setErrorMessage: (msg: string) => void;
  isSubmitting: boolean;
}

/** "Temporary user" toggle + expiry date when creating a new vikar. */
const NewVikarSection: React.FC<Props> = ({
  formData, handleInputChange, handleSelectChange, onCheckboxChange, setErrorMessage, isSubmitting,
}) => {
  const { t } = useTranslation();
  return (
              <div className="space-y-4">
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
              </div>
  );
};

export default NewVikarSection;
