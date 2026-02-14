import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Package, Shield, UserPlus, MessageSquare, Files } from 'lucide-react';

const FeatureToggleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedDepartment, selectedDepartmentId, refetchDepartments } = useDepartment();

  const [warehouseEnabled, setWarehouseEnabled] = useState(true);
  const [dutyEnabled, setDutyEnabled] = useState(true);
  const [substituteEnabled, setSubstituteEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [filesEnabled, setFilesEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedDepartment) {
      setWarehouseEnabled(selectedDepartment.warehouse_enabled);
      setDutyEnabled(selectedDepartment.duty_enabled);
      setSubstituteEnabled(selectedDepartment.substitute_enabled);
      setChatEnabled(selectedDepartment.chat_enabled);
      setFilesEnabled(selectedDepartment.files_enabled);
    }
  }, [selectedDepartment]);

  const setterMap: Record<string, (v: boolean) => void> = {
    warehouse_enabled: setWarehouseEnabled,
    duty_enabled: setDutyEnabled,
    substitute_enabled: setSubstituteEnabled,
    chat_enabled: setChatEnabled,
    files_enabled: setFilesEnabled,
  };

  const handleToggle = async (field: 'warehouse_enabled' | 'duty_enabled' | 'substitute_enabled' | 'chat_enabled' | 'files_enabled', value: boolean) => {
    if (!selectedDepartmentId) return;
    setSaving(true);

    setterMap[field](value);

    const { error } = await supabase
      .from('departments')
      .update({ [field]: value } as any)
      .eq('id', selectedDepartmentId);

    if (error) {
      setterMap[field](!value);
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      setSaving(false);
    } else {
      toast({ title: t('admin.features.updated') });
      refetchDepartments();
      setSaving(false);
      // Reload page so all components reflect the change
      setTimeout(() => window.location.reload(), 500);
    }
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

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">{t('admin.features.substituteEnabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {substituteEnabled ? t('admin.features.enabled') : t('admin.features.disabled')}
              </p>
            </div>
          </div>
          <Switch
            checked={substituteEnabled}
            onCheckedChange={(v) => handleToggle('substitute_enabled', v)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">{t('admin.features.chatEnabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {chatEnabled ? t('admin.features.enabled') : t('admin.features.disabled')}
              </p>
            </div>
          </div>
          <Switch
            checked={chatEnabled}
            onCheckedChange={(v) => handleToggle('chat_enabled', v)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Files className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">{t('admin.features.filesEnabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {filesEnabled ? t('admin.features.enabled') : t('admin.features.disabled')}
              </p>
            </div>
          </div>
          <Switch
            checked={filesEnabled}
            onCheckedChange={(v) => handleToggle('files_enabled', v)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureToggleManagement;
