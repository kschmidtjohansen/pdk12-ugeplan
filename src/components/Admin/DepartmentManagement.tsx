import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Building2, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
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

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    const { error } = await supabase
      .from('departments')
      .update({ name: editingName.trim() })
      .eq('id', id);

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('admin.departments.renamed') });
      setEditingId(null);
      fetchDepartments();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      // Nullify FK references in tables without CASCADE
      await supabase.from('profiles').update({ home_department_id: null }).eq('home_department_id', deleteTarget.id);
      await supabase.from('assignments').update({ department_id: null }).eq('department_id', deleteTarget.id);
      await supabase.from('vacations').update({ department_id: null }).eq('department_id', deleteTarget.id);
      await supabase.from('on_call_duties').update({ department_id: null }).eq('department_id', deleteTarget.id);
      await supabase.from('cars').update({ department_id: null }).eq('department_id', deleteTarget.id);
      await supabase.from('warehouse_items').update({ department_id: null }).eq('department_id', deleteTarget.id);

      // These have CASCADE but we delete explicitly for safety
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
    } catch (err: any) {
      toast({ title: t('common.error'), description: err?.message || 'Unknown error', variant: 'destructive' });
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
          <CardDescription>
            {t('admin.departments.description')}
            {!loading && departments.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                — {t('admin.departments.totalCount').replace('{count}', String(departments.length))}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {loading ? (
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          ) : departments.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('admin.departments.empty')}</p>
          ) : (
            <div className="divide-y divide-border rounded-lg border">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between px-4 py-3">
                  {editingId === dept.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(dept.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="h-8"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleRename(dept.id)} aria-label={t('common.save') || 'Gem'}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)} aria-label={t('common.cancel') || 'Annullér'}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">{dept.name}</span>
                  )}
                  {editingId !== dept.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('admin.departments.editName')}
                        aria-label={t('admin.departments.editName') || 'Rediger navn'}
                        onClick={() => { setEditingId(dept.id); setEditingName(dept.name); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={t('common.delete') || 'Slet'}
                        onClick={() => setDeleteTarget(dept)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.departments.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.departments.deleteWarning')}</AlertDialogDescription>
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
