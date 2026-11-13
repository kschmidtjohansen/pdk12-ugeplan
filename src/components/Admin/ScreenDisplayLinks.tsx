import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Copy, Ban, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { screenUrl } from '@/lib/screenDisplayRpc';

type ScreenLink = { token: string; department_id: string; label: string; created_at: string; revoked_at: string | null };

// screen_display_links is created by supabase/staged/sql/003_security_hardening.sql and not in the generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const links = () => (supabase as any).from('screen_display_links');

/**
 * Screen links for the selected department: each TV gets its own secret address that can be revoked,
 * instead of an address with only the department ID that anyone could reuse.
 */
const ScreenDisplayLinks: React.FC = () => {
  const { selectedDepartmentId, selectedDepartment } = useDepartment();
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const key = ['screen-display-links', selectedDepartmentId];

  const list = useQuery({
    queryKey: key,
    enabled: !!selectedDepartmentId,
    retry: false,
    queryFn: async (): Promise<ScreenLink[] | null> => {
      const { data, error } = await links().select('token, department_id, label, created_at, revoked_at')
        .eq('department_id', selectedDepartmentId).order('created_at', { ascending: false });
      if (error) { if (/screen_display_links|does not exist|schema cache/i.test(error.message)) return null; throw error; }
      return data as ScreenLink[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await links().insert({ department_id: selectedDepartmentId, label: label.trim() }).select('token').single();
      if (error) throw error;
      return (data as { token: string }).token;
    },
    onSuccess: (token) => {
      setLabel(''); qc.invalidateQueries({ queryKey: key });
      void navigator.clipboard?.writeText(screenUrl(window.location.origin, selectedDepartmentId!, token)).catch(() => {});
      toast.success('Skærmlinket er oprettet og kopieret');
    },
    onError: () => toast.error('Skærmlinket kunne ikke oprettes'),
  });

  const revoke = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await links().update({ revoked_at: new Date().toISOString() }).eq('token', token);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Skærmlinket virker ikke længere'); },
    onError: () => toast.error('Skærmlinket kunne ikke lukkes'),
  });

  const copy = (token: string) => {
    void navigator.clipboard?.writeText(screenUrl(window.location.origin, selectedDepartmentId!, token))
      .then(() => toast.success('Linket er kopieret'), () => toast.error('Linket kunne ikke kopieres'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" aria-hidden="true" />Skærme</CardTitle>
        <CardDescription>
          Hver skærm med dagens opgaver får sit eget hemmelige link til {selectedDepartment?.name ?? 'afdelingen'}. Lukker du et link, viser skærmen ingenting længere.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedDepartmentId && <p className="text-sm text-muted-foreground">Vælg en afdeling først.</p>}
        {selectedDepartmentId && list.data === null && (
          <p className="text-sm text-muted-foreground">Skærmlinks er ikke slået til i databasen endnu.</p>
        )}
        {selectedDepartmentId && list.data !== null && (
          <>
            <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
              <div className="grid gap-1.5">
                <Label htmlFor="screen-label">Navn på skærmen</Label>
                <Input id="screen-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Fx TV i værkstedet" className="w-64" maxLength={80} />
              </div>
              <Button type="submit" disabled={create.isPending}><Plus className="h-4 w-4" />Nyt skærmlink</Button>
            </form>
            {list.isLoading && <p className="text-sm text-muted-foreground">Henter skærmlinks …</p>}
            {list.data && list.data.length === 0 && <p className="text-sm text-muted-foreground">Ingen skærmlinks endnu.</p>}
            {list.data && list.data.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {list.data.map((l) => (
                  <li key={l.token} className="flex flex-wrap items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.label || 'Skærm uden navn'}</p>
                      <p className="text-xs text-muted-foreground">Oprettet {new Date(l.created_at).toLocaleDateString('da-DK')}</p>
                    </div>
                    {l.revoked_at ? (
                      <Badge variant="secondary">Lukket</Badge>
                    ) : (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => copy(l.token)}><Copy className="h-4 w-4" />Kopiér link</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => revoke.mutate(l.token)} disabled={revoke.isPending}><Ban className="h-4 w-4" />Luk</Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ScreenDisplayLinks;
