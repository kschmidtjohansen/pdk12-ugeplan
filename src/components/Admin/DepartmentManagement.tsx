import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      setDepartments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleCreate = async () => {
    if (!newDeptName.trim()) return;
    setCreating(true);
    
    const { error } = await supabase
      .from('departments')
      .insert({ name: newDeptName.trim() });
    
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('admin.departments.created') });
      setNewDeptName('');
      fetchDepartments();
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    // Delete sub_departments and user_access first
    await supabase.from('user_access').delete().eq('department_id', deleteTarget.id);
    await supabase.from('sub_departments').delete().eq('department_id', deleteTarget.id);

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('admin.departments.deleted') });
      fetchDepartments();
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>{t('admin.departments.title')}</CardTitle>
          </div>
          <CardDescription>{t('admin.departments.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new department */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-dept" className="sr-only">{t('admin.departments.name')}</Label>
              <Input
                id="new-dept"
                placeholder={t('admin.departments.name')}
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newDeptName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              {t('admin.departments.create')}
            </Button>
          </div>

          {/* Department list */}
          {loading ? (
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          ) : departments.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('admin.departments.empty')}</p>
          ) : (
            <div className="divide-y divide-border rounded-lg border">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium">{dept.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(dept)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.departments.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.departments.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('admin.departments.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DepartmentManagement;
