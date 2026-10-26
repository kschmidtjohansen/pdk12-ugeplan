import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDepartment } from '@/context/DepartmentContext';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PERSONAL_PERMISSIONS, type PersonalPermission } from '@/context/auth/permissions';

const LABELS: Record<PersonalPermission, { group: string; title: string; hint: string }> = {
  plan_assignments: { group: 'Ugeplan', title: 'Planlægge opgaver', hint: 'Oprette, rette, flytte og slette opgaver' },
  publish_assignments: { group: 'Ugeplan', title: 'Udgive opgaver', hint: 'Gøre opgaver synlige for medarbejderne' },
  view_unpublished: { group: 'Ugeplan', title: 'Se ikke-udgivne opgaver', hint: 'Se kladder før de udgives' },
  view_all_vacations: { group: 'Fri/ferie', title: 'Se alle fri/ferie', hint: 'Se alle anmodninger i afdelingen' },
  approve_vacations: { group: 'Fri/ferie', title: 'Godkende fri/ferie', hint: 'Godkende, afvise og anmode for andre' },
  view_fuel_codes: { group: 'Biler', title: 'Se brændstofkort-koder', hint: 'Vise koder på bilernes brændstofkort' },
  view_warehouse: { group: 'Lager', title: 'Se lager', hint: 'Se lagersiden og dens varer' },
  manage_warehouse: { group: 'Lager', title: 'Administrere lager', hint: 'Oprette, rette og slette varer på lageret' },
  view_duty: { group: 'Vagtplan', title: 'Se vagtplan', hint: 'Se vagtplansiden' },
  manage_duty: { group: 'Vagtplan', title: 'Administrere vagtplan', hint: 'Tildele, rette og slette vagter' },
};

type Choice = 'default' | 'on' | 'off';
interface Person { id: string; name: string }
interface Sub { id: string; name: string; department_id: string }

const UserPermissionsPanel: React.FC = () => {
  const { toast } = useToast();
  const { selectedDepartmentId } = useDepartment();
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Person | null>(null);
  const [choices, setChoices] = useState<Map<string, boolean>>(new Map());
  const [deptIds, setDeptIds] = useState<string[]>([]);
  const [deptNames, setDeptNames] = useState<Record<string, string>>({});
  const [subs, setSubs] = useState<Sub[]>([]);
  const [subAccess, setSubAccess] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selectedDepartmentId) return;
    (async () => {
      const { data: access } = await supabase.from('user_access').select('user_id').eq('department_id', selectedDepartmentId);
      const ids = [...new Set((access ?? []).map((a) => a.user_id))];
      if (ids.length === 0) { setPeople([]); return; }
      const { data } = await supabase.from('profiles').select('id, name').in('id', ids).order('name');
      setPeople((data ?? []) as Person[]);
    })();
  }, [selectedDepartmentId]);

  const loadPerson = useCallback(async (p: Person) => {
    const [{ data: perms }, { data: access }] = await Promise.all([
      supabase.from('user_permissions').select('permission, granted').eq('user_id', p.id),
      supabase.from('user_access').select('department_id, sub_department_id').eq('user_id', p.id),
    ]);
    setChoices(new Map((perms ?? []).map((r) => [r.permission, r.granted])));
    const depts = [...new Set((access ?? []).map((a) => a.department_id))];
    setDeptIds(depts);
    setSubAccess(new Set((access ?? []).map((a) => a.sub_department_id).filter(Boolean) as string[]));
    if (depts.length) {
      const [{ data: s }, { data: d }] = await Promise.all([
        supabase.from('sub_departments').select('id, name, department_id').in('department_id', depts).order('name'),
        supabase.from('departments').select('id, name').in('id', depts),
      ]);
      setSubs((s ?? []) as Sub[]);
      setDeptNames(Object.fromEntries((d ?? []).map((x) => [x.id, x.name])));
    } else { setSubs([]); setDeptNames({}); }
  }, []);

  useEffect(() => { if (selected) void loadPerson(selected); }, [selected, loadPerson]);

  const filtered = useMemo(
    () => people.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 50),
    [people, search],
  );

  const setChoice = async (perm: PersonalPermission, c: Choice) => {
    if (!selected || !c) return;
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = c === 'default'
      ? await supabase.from('user_permissions').delete().eq('user_id', selected.id).eq('permission', perm)
      : await supabase.from('user_permissions').upsert(
          { user_id: selected.id, permission: perm, granted: c === 'on', updated_by: auth.user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,permission' },
        );
    setBusy(false);
    if (error) { toast({ title: 'Ændringen blev ikke gemt', description: error.message, variant: 'destructive' }); return; }
    setChoices((prev) => { const n = new Map(prev); if (c === 'default') n.delete(perm); else n.set(perm, c === 'on'); return n; });
    window.dispatchEvent(new Event('role-permissions-changed'));
  };

  const toggleSub = async (deptId: string, subId: string, on: boolean) => {
    if (!selected) return;
    const next = new Set(subAccess);
    if (on) next.add(subId); else next.delete(subId);
    const deptSubs = subs.filter((s) => s.department_id === deptId && next.has(s.id)).map((s) => s.id);
    setBusy(true);
    // Replace this department's access rows; no sub-departments = whole department.
    const { error: delErr } = await supabase.from('user_access').delete().eq('user_id', selected.id).eq('department_id', deptId);
    const rows = deptSubs.length
      ? deptSubs.map((sid) => ({ user_id: selected.id, department_id: deptId, sub_department_id: sid }))
      : [{ user_id: selected.id, department_id: deptId }];
    const { error: insErr } = delErr ? { error: delErr } : await supabase.from('user_access').insert(rows);
    setBusy(false);
    if (insErr) { toast({ title: 'Underafdeling blev ikke gemt', description: insErr.message, variant: 'destructive' }); void loadPerson(selected); return; }
    setSubAccess(next);
  };

  const groups = [...new Set(PERSONAL_PERMISSIONS.map((p) => LABELS[p].group))];

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="space-y-2">
        <Input placeholder="Søg medarbejder…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Søg medarbejder" />
        <ul className="max-h-[480px] overflow-y-auto rounded-xl border border-border divide-y divide-border">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className={`w-full min-h-11 px-3 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected?.id === p.id ? 'bg-muted font-medium' : ''}`}
              >{p.name}</button>
            </li>
          ))}
          {filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">Ingen medarbejdere</li>}
        </ul>
      </div>

      {!selected ? (
        <p className="text-sm text-muted-foreground">Vælg en medarbejder for at slå funktioner til eller fra.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">{selected.name}</h3>
            <p className="text-xs text-muted-foreground">"Standard" følger rollen. "Til" og "Fra" gælder kun denne medarbejder.</p>
          </div>
          {groups.map((g) => (
            <section key={g} className="rounded-xl border border-border">
              <h4 className="border-b border-border bg-muted/50 px-3 py-2 text-sm font-medium">{g}</h4>
              {PERSONAL_PERMISSIONS.filter((p) => LABELS[p].group === g).map((p) => {
                const v = choices.get(p);
                const value: Choice = v === undefined ? 'default' : v ? 'on' : 'off';
                return (
                  <div key={p} className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 first-of-type:border-t-0">
                    <div>
                      <div className="text-sm font-medium text-foreground">{LABELS[p].title}</div>
                      <div className="text-xs text-muted-foreground">{LABELS[p].hint}</div>
                    </div>
                    <ToggleGroup type="single" size="sm" variant="outline" value={value} disabled={busy}
                      onValueChange={(c) => void setChoice(p, c as Choice)} aria-label={LABELS[p].title}>
                      <ToggleGroupItem value="default">Standard</ToggleGroupItem>
                      <ToggleGroupItem value="on">Til</ToggleGroupItem>
                      <ToggleGroupItem value="off">Fra</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                );
              })}
            </section>
          ))}
          <section className="rounded-xl border border-border">
            <h4 className="border-b border-border bg-muted/50 px-3 py-2 text-sm font-medium">Underafdelinger</h4>
            <div className="space-y-3 p-3">
              {deptIds.length === 0 && <p className="text-sm text-muted-foreground">Ikke tilknyttet nogen afdeling.</p>}
              {deptIds.map((d) => {
                const ds = subs.filter((s) => s.department_id === d);
                return (
                  <div key={d}>
                    <div className="text-sm font-medium">{deptNames[d] ?? 'Afdeling'}</div>
                    {ds.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Ingen underafdelinger — adgang til hele afdelingen.</p>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-3">
                        {ds.map((s) => (
                          <label key={s.id} className="flex min-h-11 items-center gap-2 text-sm">
                            <Checkbox checked={subAccess.has(s.id)} disabled={busy} onCheckedChange={(c) => void toggleSub(d, s.id, c === true)} />
                            {s.name}
                          </label>
                        ))}
                        <span className="self-center text-xs text-muted-foreground">Ingen valgt = hele afdelingen</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default UserPermissionsPanel;
