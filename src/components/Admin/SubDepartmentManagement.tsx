import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Layers, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';

interface Department { id: string; name: string; }
interface SubDepartment { id: string; name: string; department_id: string; }

const SubDepartmentManagement: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [newSubName, setNewSubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubDepartment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      let deptQuery = supabase.from('departments').select('id, name').order('name');

      if (!isSuperAdmin) {
        const { data: access } = await supabase
          .from('user_access')
          .select('department_id')
          .eq('user_id', user?.id || '');
        
        const deptIds = access?.map(a => a.department_id) || [];
        if (deptIds.length > 0) {
          deptQuery = deptQuery.in('id', deptIds);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('home_department_id')
            .eq('id', user?.id || '')
            .maybeSingle();
          if (profile?.home_department_id) {
            deptQuery = deptQuery.eq('id', profile.home_department_id);
          }
        }
      }

      const { data: depts } = await deptQuery;
      setDepartments(depts || []);
      if (depts && depts.length > 0 && !selectedDeptId) {
        setSelectedDeptId(depts[0].id);
      }
      setLoading(false);
    };
    fetchData();
  }, [user?.id, isSuperAdmin]);

  useEffect(() => {
    if (!selectedDeptId) return;
    const fetchSubs = async () => {
      const { data } = await supabase
        .from('sub_departments')
        .select('id, name, department_id')
        .eq('department_id', selectedDeptId)
        .order('name');
      setSubDepartments(data || []);
    };
    fetchSubs();
  }, [selectedDeptId]);

  const handleCreate = async () => {
    if (!newSubName.trim() || !selectedDeptId) return;
    setCreating(true);
    const { error } = await supabase
      .from('sub_departments')
      .insert({ name: newSubName.trim(), department_id: selectedDeptId });
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('admin.subDepartments.created') });
      setNewSubName('');
      const { data } = await supabase
        .from('sub_departments')
        .select('id, name, department_id')
        .eq('department_id', selectedDeptId)
        .order('name');
      setSubDepartments(data || []);
    }
    setCreating(false);
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    const { error } = await supabase
      .from('sub_departments')
      .update({ name: editingName.trim() })
      .eq('id', id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('admin.subDepartments.renamed') });
      setEditingId(null);
      setSubDepartments(prev => prev.map(s => s.id === id ? { ...s, name: editingName.trim() } : s));
    }
  };

  const handleDeleteAttempt = async (sub: SubDepartment) => {
    // Check for associated data
    const { count: accessCount } = await supabase
      .from('user_access')
      .select('*', { count: 'exact', head: true })
      .eq('sub_department_id', sub.id);

    const { count: assignmentCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('sub_department_id', sub.id);

    const totalRefs = (accessCount || 0) + (assignmentCount || 0);

    if (totalRefs > 0) {
      setDeleteBlocked(true);
      toast({ title: t('common.error'), description: t('admin.subDepartments.hasData'), variant: 'destructive' });
      return;
    }

    setDeleteBlocked(false);
    setDeleteTarget(sub);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    await supabase.from('user_access').delete().eq('sub_department_id', deleteTarget.id);

    const { error } = await supabase
      .from('sub_departments')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('admin.subDepartments.deleted') });
      setSubDepartments(prev => prev.filter(s => s.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const selectedDeptName = departments.find(d => d.id === selectedDeptId)?.name || '';

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle>{t('admin.subDepartments.title')}</CardTitle>
          </div>
          <CardDescription>{t('admin.subDepartments.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {departments.length > 1 && (
            <div className="space-y-1">
              <Label>{t('admin.departments.selectCity')}</Label>
              <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {departments.length === 1 && (
            <p className="text-sm text-muted-foreground">{selectedDeptName}</p>
          )}

          {selectedDeptId && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-sub" className="sr-only">{t('admin.subDepartments.name')}</Label>
                <Input
                  id="new-sub"
                  placeholder={t('admin.subDepartments.name')}
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating || !newSubName.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.subDepartments.create')}
              </Button>
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          ) : subDepartments.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('admin.subDepartments.empty')}</p>
          ) : (
            <div className="divide-y divide-border rounded-lg border">
              {subDepartments.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between px-4 py-3">
                  {editingId === sub.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(sub.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="h-8"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleRename(sub.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">{sub.name}</span>
                  )}
                  {editingId !== sub.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('admin.subDepartments.editName')}
                        onClick={() => { setEditingId(sub.id); setEditingName(sub.name); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAttempt(sub)}
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
            <AlertDialogTitle>{t('admin.subDepartments.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.subDepartments.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('admin.subDepartments.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SubDepartmentManagement;
