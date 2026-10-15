import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarPlus, UserCheck } from 'lucide-react';
import { format, addWeeks, addMonths, startOfToday } from 'date-fns';
import { useTranslation } from '@/context/TranslationContext';
import { useDateLocale } from '@/hooks/useDateLocale';
import type { Employee } from '@/types/employee';
import type { EmployeeFormData, InputChangeHandler } from './types';

interface Props {
  currentEmployee: Employee | null;
  formData: EmployeeFormData;
  handleInputChange: InputChangeHandler;
  convertToPermanent: boolean;
  setConvertToPermanent: (v: boolean) => void;
  isSubmitting: boolean;
}

/** Shown when an admin edits a vikar: extend employment or convert to permanent. */
const VikarConversionSection: React.FC<Props> = ({
  currentEmployee, formData, handleInputChange, convertToPermanent, setConvertToPermanent, isSubmitting,
}) => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  return (
                <div className="space-y-3 p-3 bg-warning-soft border border-warning/30 rounded-md">
                  <div className="flex items-start space-x-2">
                    <UserCheck className="h-4 w-4 mt-0.5 text-warning" />
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-warning-soft-foreground">
                        {t('employees.currentlyVikar')}
                      </p>
                      {currentEmployee?.expires_at && !convertToPermanent && (
                        <p className="text-xs text-warning">
                          {t('employees.vikarExpiresInfo', { 
                            date: format(new Date(currentEmployee.expires_at), 'd. MMMM yyyy', { locale: dateLocale })
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {!convertToPermanent && (() => {
                    // Extension always counts from the latest of: current expiry or today
                    const currentExpiryDate = currentEmployee?.expires_at ? new Date(currentEmployee.expires_at) : null;
                    const today = startOfToday();
                    const baseDate = currentExpiryDate && currentExpiryDate > today ? currentExpiryDate : today;
                    const minDate = format(baseDate, 'yyyy-MM-dd');
                    return (
                    <div className="pt-2 border-t border-warning/30 space-y-2">
                      <Label htmlFor="edit_expires_at" className="text-sm font-medium text-warning-soft-foreground">
                        {t('employees.newExpirationDate')}
                      </Label>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="w-full h-8 text-sm"
                        disabled={isSubmitting}
                        onClick={() => handleInputChange({
                          target: { name: 'expires_at', value: format(addMonths(baseDate, 1), 'yyyy-MM-dd') }
                        } as any)}
                      >
                        <CalendarPlus className="h-4 w-4 mr-1.5" />
                        {t('employees.extendEmployment')}
                      </Button>
                      <Input
                        id="edit_expires_at"
                        name="expires_at"
                        type="date"
                        value={formData.expires_at}
                        onChange={handleInputChange}
                        min={minDate}
                        disabled={isSubmitting}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: t('employees.extend1Week'), date: addWeeks(baseDate, 1) },
                          { label: t('employees.extend2Weeks'), date: addWeeks(baseDate, 2) },
                          { label: t('employees.extend1Month'), date: addMonths(baseDate, 1) },
                          { label: t('employees.extend3Months'), date: addMonths(baseDate, 3) },
                        ].map(opt => (
                          <Button
                            key={opt.label}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={isSubmitting}
                            onClick={() => handleInputChange({
                              target: { name: 'expires_at', value: format(opt.date, 'yyyy-MM-dd') }
                            } as any)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                      {formData.expires_at && currentEmployee?.expires_at && formData.expires_at !== new Date(currentEmployee.expires_at).toISOString().split('T')[0] && (
                        <p className="text-xs text-warning">
                          {t('employees.newExpiryPreview', {
                            date: format(new Date(formData.expires_at), 'd. MMMM yyyy', { locale: dateLocale })
                          })}
                        </p>
                      )}
                    </div>
                    );
                  })()}
                  <div className="flex items-center space-x-2 pt-2 border-t border-warning/30">
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
                    <p className="text-xs text-warning pl-6">
                      {t('employees.convertToPermanentNote')}
                    </p>
                  )}
                </div>
  );
};

export default VikarConversionSection;
