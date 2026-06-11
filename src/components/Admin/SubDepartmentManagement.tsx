import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layers, Plus, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { getRoleBadgeClass } from '@/utils/roleColors';

type VisibleRole = 'skadeleder' | 'fugttekniker' | 'servicemedarbejder';
const ALL_ROLES: VisibleRole[] = ['skadeleder', 'fugttekniker', 'servicemedarbejder'];

interface Department { id: string; name: string; }
interface SubDepartment {
  id: string;
  name: string;
  department_id: string;
  visible_roles: VisibleRole[];
}
interface CarOption {
  id: string;
  name: string;
  car_number: string | null;
}

const SubDepartmentManagement: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SubDepartment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Dialog state for create / edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubDepartment | null>(null);
  const [formName, setFormName] = useState('');
  const [formRoles, setFormRoles] = useState<VisibleRole[]>([...ALL_ROLES]);
  const [formCarIds, setFormCarIds] = useState<string[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [subCarCounts, setSubCarCounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchSubs = async (deptId: string) => {
    const { data } = await supabase
      .from('sub_departments')
      .select('id, name, department_id, visible_roles')
      .eq('department_id', deptId)
      .order('name');
    setSubDepartments((data as SubDepartment[]) || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      let deptQuery = supabase.from('departments').select('id, name').order('name');
      if (!isSuperAdmin) {
        const { data: access } = await supabase
          .from('user_access').select('department_id').eq('user_id', user?.id || '');
        const deptIds = access?.map(a => a.department_id) || [];
        if (deptIds.length > 0) {
          deptQuery = deptQuery.in('id', deptIds);
        } else {
          const { data: profile } = await supabase
            .from('profiles').select('home_department_id')
            .eq('id', user?.id || '').maybeSingle();
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
    fetchSubs(selectedDeptId);
  }, [selectedDeptId]);

  const openCreateDialog = () => {
    setEditingSub(null);
    setFormName('');
    setFormRoles([...ALL_ROLES]);
    setDialogOpen(true);
  };

  const openEditDialog = (sub: SubDepartment) => {
    setEditingSub(sub);
    setFormName(sub.name);
    setFormRoles(sub.visible_roles?.length ? [...sub.visible_roles] : [...ALL_ROLES]);
    setDialogOpen(true);
  };

  const toggleRole = (role: VisibleRole, checked: boolean) => {
    setFormRoles(prev => checked ? [...new Set([...prev, role])] : prev.filter(r => r !== role));
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !selectedDeptId) return;
    if (formRoles.length === 0) {
      toast({
        title: t('common.error'),
        description: t('admin.subDepartments.pickAtLeastOneRole') || 'Vælg mindst én rolle',
        variant: 'destructive'
      });
      return;
    }
    setSubmitting(true);
    if (editingSub) {
      const { error } = await supabase
        .from('sub_departments')
        .update({ name: formName.trim(), visible_roles: formRoles })
        .eq('id', editingSub.id);
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('common.success'), description: t('admin.subDepartments.renamed') });
        setDialogOpen(false);
        fetchSubs(selectedDeptId);
      }
    } else {
      const { error } = await supabase
        .from('sub_departments')
        .insert({ name: formName.trim(), department_id: selectedDeptId, visible_roles: formRoles });
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('common.success'), description: t('admin.subDepartments.created') });
        setDialogOpen(false);
        fetchSubs(selectedDeptId);
      }
    }
    setSubmitting(false);
  };

  const handleDeleteAttempt = async (sub: SubDepartment) => {
    const { count: accessCount } = await supabase
      .from('user_access').select('*', { count: 'exact', head: true })
      .eq('sub_department_id', sub.id);
    const { count: assignmentCount } = await supabase
      .from('assignments').select('*', { count: 'exact', head: true })
      .eq('sub_department_id', sub.id);
    const totalRefs = (accessCount || 0) + (assignmentCount || 0);
    if (totalRefs > 0) {
      toast({
        title: t('common.error'),
        description: t('admin.subDepartments.hasData'),
        variant: 'destructive',
      });
      return;
    }
    setDeleteTarget(sub);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('user_access').delete().eq('sub_department_id', deleteTarget.id);
    const { error } = await supabase
      .from('sub_departments').delete().eq('id', deleteTarget.id);
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

  const roleLabel = (role: VisibleRole) =>
    t(`employees.${role}`) || role;

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
            <div className="flex justify-end">
              <Button onClick={openCreateDialog}>
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
                <div key={sub.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{sub.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(sub.visible_roles?.length ? sub.visible_roles : ALL_ROLES).map(r => (
                        <Badge key={r} className={`text-[10px] px-1.5 py-0.5 ${getRoleBadgeClass(r)}`}>
                          {roleLabel(r)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t('admin.subDepartments.editName')}
                      aria-label={t('admin.subDepartments.editName') || 'Rediger'}
                      onClick={() => openEditDialog(sub)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      aria-label={t('common.delete') || 'Slet'}
                      onClick={() => handleDeleteAttempt(sub)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSub
                ? (t('admin.subDepartments.editTitle') || 'Rediger underafdeling')
                : (t('admin.subDepartments.createTitle') || 'Ny underafdeling')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.subDepartments.visibleRolesHelp')
                || 'Vælg hvilke medarbejderroller der skal vises i denne underafdeling.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name">{t('admin.subDepartments.name')}</Label>
              <Input
                id="sub-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.subDepartments.visibleRoles') || 'Synlige roller'}</Label>
              <div className="space-y-2">
                {ALL_ROLES.map(role => {
                  const checked = formRoles.includes(role);
                  return (
                    <label
                      key={role}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border cursor-pointer hover:bg-accent/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => toggleRole(role, c === true)}
                      />
                      <Badge className={`text-[10px] px-1.5 py-0.5 ${getRoleBadgeClass(role)}`}>
                        {roleLabel(role)}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formName.trim() || formRoles.length === 0}>
              {editingSub ? t('common.save') : t('admin.subDepartments.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
