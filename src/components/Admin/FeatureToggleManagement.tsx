import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Package, Shield } from 'lucide-react';

const FeatureToggleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedDepartment, selectedDepartmentId, refetchDepartments } = useDepartment();

  const [warehouseEnabled, setWarehouseEnabled] = useState(true);
  const [dutyEnabled, setDutyEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedDepartment) {
      setWarehouseEnabled(selectedDepartment.warehouse_enabled);
      setDutyEnabled(selectedDepartment.duty_enabled);
    }
  }, [selectedDepartment]);

  const handleToggle = async (field: 'warehouse_enabled' | 'duty_enabled', value: boolean) => {
    if (!selectedDepartmentId) return;
    setSaving(true);

    if (field === 'warehouse_enabled') setWarehouseEnabled(value);
    else setDutyEnabled(value);

    const { error } = await supabase
      .from('departments')
      .update({ [field]: value } as any)
      .eq('id', selectedDepartmentId);

    if (error) {
      // revert
      if (field === 'warehouse_enabled') setWarehouseEnabled(!value);
      else setDutyEnabled(!value);
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('admin.features.updated') });
      refetchDepartments();
    }
    setSaving(false);
  };

  if (!selectedDepartment) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('admin.departments.selectCity')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('admin.features.title')}
        </CardTitle>
        <CardDescription>
          {t('admin.features.description')} — <strong>{selectedDepartment.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">{t('admin.features.warehouseEnabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {warehouseEnabled ? t('admin.features.enabled') : t('admin.features.disabled')}
              </p>
            </div>
          </div>
          <Switch
            checked={warehouseEnabled}
            onCheckedChange={(v) => handleToggle('warehouse_enabled', v)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">{t('admin.features.dutyEnabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {dutyEnabled ? t('admin.features.enabled') : t('admin.features.disabled')}
              </p>
            </div>
          </div>
          <Switch
            checked={dutyEnabled}
            onCheckedChange={(v) => handleToggle('duty_enabled', v)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureToggleManagement;
