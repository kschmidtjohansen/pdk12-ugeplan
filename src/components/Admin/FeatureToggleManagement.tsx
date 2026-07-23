import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Package, Shield, UserPlus, MessageSquare, Files, Share2 } from 'lucide-react';

const FeatureToggleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedDepartment, selectedDepartmentId, departments, refetchDepartments } = useDepartment();

  const [warehouseEnabled, setWarehouseEnabled] = useState(true);
  const [dutyEnabled, setDutyEnabled] = useState(true);
  const [substituteEnabled, setSubstituteEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [filesEnabled, setFilesEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharedDutyDeptIds, setSharedDutyDeptIds] = useState<string[]>([]);
  const [savingShared, setSavingShared] = useState(false);

  useEffect(() => {
    if (selectedDepartment) {
      setWarehouseEnabled(selectedDepartment.warehouse_enabled);
      setDutyEnabled(selectedDepartment.duty_enabled);
      setSubstituteEnabled(selectedDepartment.substitute_enabled);
      setChatEnabled(selectedDepartment.chat_enabled);
      setFilesEnabled(selectedDepartment.files_enabled);
    }
  }, [selectedDepartment]);

  // Fetch shared duty departments for the current department
  useEffect(() => {
    if (!selectedDepartmentId) { setSharedDutyDeptIds([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('department_settings')
        .select('setting_value')
        .eq('department_id', selectedDepartmentId)
        .eq('setting_key', 'shared_duty_departments')
        .maybeSingle();
      if (cancelled) return;
      if (!data?.setting_value) { setSharedDutyDeptIds([]); return; }
      try {
        const parsed = JSON.parse(data.setting_value);
        setSharedDutyDeptIds(Array.isArray(parsed) ? parsed.filter((x: any) => typeof x === 'string') : []);
      } catch {
        setSharedDutyDeptIds([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDepartmentId]);

  const toggleSharedDept = async (deptId: string, checked: boolean) => {
    if (!selectedDepartmentId) return;
    setSavingShared(true);
    const next = checked
      ? Array.from(new Set([...sharedDutyDeptIds, deptId]))
      : sharedDutyDeptIds.filter(id => id !== deptId);
    setSharedDutyDeptIds(next);

    // Upsert on this department
    const { error } = await supabase
      .from('department_settings')
      .upsert(
        {
          department_id: selectedDepartmentId,
          setting_key: 'shared_duty_departments',
          setting_value: JSON.stringify(next),
        },
        { onConflict: 'department_id,setting_key' }
      );

    // Mirror the relationship on the other department so sharing works both ways
    if (!error) {
      const { data: other } = await supabase
        .from('department_settings')
        .select('setting_value')
        .eq('department_id', deptId)
        .eq('setting_key', 'shared_duty_departments')
        .maybeSingle();
      let otherList: string[] = [];
      try { otherList = other?.setting_value ? JSON.parse(other.setting_value) : []; } catch { otherList = []; }
      const otherNext = checked
        ? Array.from(new Set([...otherList, selectedDepartmentId]))
        : otherList.filter((id: string) => id !== selectedDepartmentId);
      await supabase
        .from('department_settings')
        .upsert(
          {
            department_id: deptId,
            setting_key: 'shared_duty_departments',
            setting_value: JSON.stringify(otherNext),
          },
          { onConflict: 'department_id,setting_key' }
        );
    }

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      setSharedDutyDeptIds(sharedDutyDeptIds);
    } else {
      toast({ title: t('admin.features.updated') });
    }
    setSavingShared(false);
  };

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
