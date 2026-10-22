import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { GRANTABLE_PERMISSIONS, type GrantablePermission } from '@/context/auth/permissions';
import type { Database } from '@/integrations/supabase/types';

type Role = Database['public']['Enums']['user_role'];

const ROLES: { role: Role; label: string }[] = [
  { role: 'administrator', label: 'Administrator' },
  { role: 'skadeleder', label: 'Skadeleder' },
  { role: 'fugttekniker', label: 'Fugttekniker' },
  { role: 'servicemedarbejder', label: 'Servicemedarbejder' },
  { role: 'vikar', label: 'Vikar' },
];

const LABELS: Record<GrantablePermission, { title: string; hint: string }> = {
  plan_assignments: { title: 'Planlægge opgaver', hint: 'Oprette, rette og slette opgaver i ugeplanen' },
  publish_assignments: { title: 'Udgive opgaver', hint: 'Gøre opgaver synlige for medarbejderne' },
  view_all_vacations: { title: 'Se alle fri/ferie', hint: 'Se alle anmodninger i afdelingen' },
  approve_vacations: { title: 'Godkende fri/ferie', hint: 'Godkende og afvise anmodninger' },
};

const key = (r: Role, p: string) => `${r}:${p}`;

const RolePermissionsManagement: React.FC = () => {
  const { toast } = useToast();
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('role_permissions').select('role, permission');
    if (error) toast({ title: 'Kunne ikke hente rettigheder', description: error.message, variant: 'destructive' });
    setGranted(new Set((data ?? []).map((r) => key(r.role, r.permission))));
    setLoading(false);
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (role: Role, permission: GrantablePermission, on: boolean) => {
    const k = key(role, permission);
    setBusy(k);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = on
      ? await supabase.from('role_permissions').insert({ role, permission, updated_by: auth.user?.id ?? null })
      : await supabase.from('role_permissions').delete().eq('role', role).eq('permission', permission);
    setBusy(null);
    if (error) {
      toast({ title: 'Ændringen blev ikke gemt', description: error.message, variant: 'destructive' });
      return;
    }
    setGranted((prev) => {
      const next = new Set(prev);
      if (on) next.add(k); else next.delete(k);
      return next;
    });
    window.dispatchEvent(new Event('role-permissions-changed'));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Henter…</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">Ekstra rettigheder pr. rolle</caption>
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="p-3 text-left font-medium">Rettighed</th>
            {ROLES.map((r) => (
              <th key={r.role} scope="col" className="p-3 text-center font-medium">{r.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRANTABLE_PERMISSIONS.map((p) => (
            <tr key={p} className="border-t border-border">
              <th scope="row" className="p-3 text-left font-normal">
                <div className="font-medium text-foreground">{LABELS[p].title}</div>
                <div className="text-xs text-muted-foreground">{LABELS[p].hint}</div>
              </th>
              {ROLES.map((r) => {
                const k = key(r.role, p);
                return (
                  <td key={r.role} className="p-3 text-center">
                    <Switch
                      checked={granted.has(k)}
                      disabled={busy === k}
                      onCheckedChange={(v) => void toggle(r.role, p, v)}
                      aria-label={`${LABELS[p].title} for ${r.label}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RolePermissionsManagement;
