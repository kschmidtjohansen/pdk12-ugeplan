import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/context/TranslationContext';
import type { EmployeeFormData, InputChangeHandler } from './types';

interface Props {
  departmentId: string | null;
  formData: EmployeeFormData;
  handleInputChange: InputChangeHandler;
  isSubmitting: boolean;
}

/** Sub-department picker for the selected main department. Renders nothing if none exist. */
const SubDepartmentField: React.FC<Props> = ({ departmentId, formData, handleInputChange, isSubmitting }) => {
  const { t } = useTranslation();
  const [subDepartments, setSubDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!departmentId) { setSubDepartments([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('sub_departments')
        .select('id, name')
        .eq('department_id', departmentId)
        .order('name');
      if (!cancelled) setSubDepartments(data ?? []);
    })();
    return () => { cancelled = true; };
  }, [departmentId]);

  if (subDepartments.length === 0) return null;
  return (
                <div className="grid gap-2">
                  <Label htmlFor="sub_department_id">Underafdeling</Label>
                  <Select
                    value={formData.sub_department_id || '__none__'}
                    onValueChange={(value) => {
                      handleInputChange({
                        target: { name: 'sub_department_id', value: value === '__none__' ? '' : value }
                      } as any);
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="sub_department_id">
                      <SelectValue placeholder={t('ui.selectSubDepartment')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('ui.noneMainDeptOnly')}</SelectItem>
                      {subDepartments.map(sd => (
                        <SelectItem key={sd.id} value={sd.id}>{sd.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('ui.subDepartmentHint')}
                  </p>
                </div>
  );
};

export default SubDepartmentField;
