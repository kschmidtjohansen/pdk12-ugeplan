import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import type { EmployeeFormData } from './types';

interface Props {
  formData: EmployeeFormData;
  convertToPermanent: boolean;
  isSuperAdmin: boolean;
  handleRoleToggle?: (role: string, checked: boolean) => void;
  handleSelectChange: (value: string) => void;
  onCheckboxChange: (field: string, checked: boolean) => void;
  isSubmitting: boolean;
}

const RoleSection: React.FC<Props> = ({
  formData, convertToPermanent, isSuperAdmin, handleRoleToggle, handleSelectChange, onCheckboxChange, isSubmitting,
}) => {
  const { t } = useTranslation();
  return (
              <div className="grid gap-2">
                <Label>{t("employees.role")}</Label>
                {formData.is_temporary && !convertToPermanent ? (
                  <p className="text-xs text-muted-foreground">
                    {t('employees.vikarAutoRole')}
                  </p>
                ) : (
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Vælg én eller flere roller. Rollen med flest rettigheder bestemmer adgangen.
                    </p>
                    {(() => {
                      const allRoles: { value: string; label: string }[] = [
                        ...(isSuperAdmin ? [{ value: 'super_admin', label: t('employees.super_admin') }] : []),
                        { value: 'administrator', label: t('employees.administrator') },
                        { value: 'skadeleder', label: t('employees.skadeleder') },
                        { value: 'fugttekniker', label: t('employees.fugttekniker') },
                        { value: 'servicemedarbejder', label: t('employees.servicemedarbejder') },
                        { value: 'vikar', label: t('employees.vikar') },
                      ];
                      const selectedRoles: string[] = Array.isArray(formData.roles) && formData.roles.length
                        ? formData.roles
                        : [formData.role];
                      return allRoles.map(r => {
                        const checked = selectedRoles.includes(r.value);
                        return (
                          <div key={r.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`role-${r.value}`}
                              checked={checked}
                              onCheckedChange={(c) => {
                                const isChecked = c as boolean;
                                if (handleRoleToggle) {
                                  handleRoleToggle(r.value, isChecked);
                                } else {
                                  // Fallback: behave like single-select
                                  if (isChecked) handleSelectChange(r.value);
                                }
                                if (isChecked && r.value === 'super_admin') {
                                  onCheckboxChange('skip_department', true);
                                }
                              }}
                              disabled={isSubmitting}
                            />
                            <Label htmlFor={`role-${r.value}`} className="text-sm font-normal cursor-pointer">
                              {r.label}
                            </Label>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
  );
};

export default RoleSection;
