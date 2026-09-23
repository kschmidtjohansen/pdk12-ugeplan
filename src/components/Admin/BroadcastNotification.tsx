import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Sparkles, Send, Loader2, Bell, RotateCcw, Undo2, Users, Check, ChevronDown } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const TITLE_LIMIT = 45;
const MESSAGE_LIMIT = 130;

// Vikarer får aldrig notifikationer og kan derfor ikke vælges som målgruppe.
const ROLE_OPTIONS = [
  'servicemedarbejder',
  'fugttekniker',
  'skadeleder',
  'administrator',
] as const;


const BroadcastNotification: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { userDepartments, selectedDepartmentId } = useDepartment();
  const { user, isDemoMode, demoRole } = useAuth();

  const effectiveRole = isDemoMode && demoRole ? demoRole : user?.role;
  const isSuperAdmin = effectiveRole === 'super_admin';

  const [rawText, setRawText] = useState('');
  const [departmentId, setDepartmentId] = useState<string>(selectedDepartmentId ?? '');
  const [roles, setRoles] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const { status: pushStatus, sendTest } = usePushNotifications();

  const departmentName = useMemo(
    () => userDepartments.find((d) => d.id === departmentId)?.name ?? '',
    [userDepartments, departmentId],
  );

  const audience = useMemo(() => {
    const rolePart = roles.length > 0 ? roles.join(', ') : t('admin.broadcast.allEmployees');
    return departmentName ? `${rolePart} i ${departmentName}` : rolePart;
  }, [roles, departmentName, t]);

  // Debounce role toggles so rapid clicking does not spam the edge function.
  const rolesKey = roles.slice().sort().join(',');
  const [debouncedRolesKey, setDebouncedRolesKey] = useState(rolesKey);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedRolesKey(rolesKey), 400);
    return () => clearTimeout(id);
  }, [rolesKey]);

  // Individual recipients inside the selected audience (empty = everyone).
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleCollapsed, setPeopleCollapsed] = useState(true);

  // Only clear the picked people when the audience really changes (not on the
  // first render or when the department id is filled in asynchronously).
  const audienceKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${departmentId ?? ''}|${debouncedRolesKey}`;
    if (audienceKeyRef.current === null) {
      audienceKeyRef.current = key;
      return;
    }
    if (audienceKeyRef.current === key) return;
    audienceKeyRef.current = key;
    setSelectedUserIds([]);
    setPeopleSearch('');
  }, [departmentId, debouncedRolesKey]);

  const { data: people = [], isFetching: peopleLoading } = useQuery({
    queryKey: ['broadcast_people', departmentId, debouncedRolesKey],
    staleTime: 60_000,
    queryFn: async (): Promise<{ id: string; name: string | null; email: string | null }[]> => {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          mode: 'list_recipients',
          departmentId: departmentId || null,
          roles: debouncedRolesKey ? debouncedRolesKey.split(',') : [],
        },
      });
      if (error) throw error;
      return data?.people ?? [];
    },
  });

  const selectedKey = selectedUserIds.slice().sort().join(',');

  // Audience shown in the confirmation dialog: named people take precedence.
  const confirmAudience = useMemo(() => {
    if (selectedUserIds.length === 0) return audience;
    const names = selectedUserIds
      .map((id) => people.find((p) => p.id === id)?.name || people.find((p) => p.id === id)?.email || '')
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : audience;
  }, [selectedUserIds, people, audience]);

  const filteredPeople = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        (p.name ?? '').toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q),
    );
  }, [people, peopleSearch]);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const { data: recipientCount, isFetching: countLoading } = useQuery({
    queryKey: ['broadcast_recipient_count', departmentId, debouncedRolesKey, selectedKey],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          mode: 'preview_recipients',
          departmentId: departmentId || null,
          roles: debouncedRolesKey ? debouncedRolesKey.split(',') : [],
          userIds: selectedUserIds,
        },
      });
      if (error) throw error;
      return Number(data?.count ?? 0);
    },
  });


  const hasEdits =
    !!generatedTitle && (title !== generatedTitle || message !== generatedMessage);

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const describeError = async (err: unknown): Promise<string> => {
    let code = '';
    const context = (err as { context?: Response })?.context;
    if (context && typeof context.json === 'function') {
      try {
        const payload = await context.clone().json();
        code = String(payload?.error ?? '');
      } catch {
        code = '';
      }
    }
    if (!code) code = String((err as { message?: string })?.message ?? '');

    const known: Record<string, string> = {
      rate_limited: t('admin.broadcast.errorRateLimited'),
      payment_required: t('admin.broadcast.errorPaymentRequired'),
      missing_api_key: t('admin.broadcast.errorMissingKey'),
      gateway_unreachable: t('admin.broadcast.errorGateway'),
      gateway_error: t('admin.broadcast.errorGateway'),
      empty_result: t('admin.broadcast.errorEmpty'),
      forbidden: t('admin.broadcast.errorForbidden'),
      forbidden_department: t('admin.broadcast.errorForbidden'),
    };
    return known[code] ?? code;
  };

  const handleGenerate = async () => {
    if (rawText.trim().length < 3) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: { mode: 'generate', text: rawText.trim(), audience },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTitle(data.title ?? '');
      setMessage(data.message ?? '');
      setGeneratedTitle(data.title ?? '');
      setGeneratedMessage(data.message ?? '');
    } catch (err) {
      toast({
        title: t('admin.broadcast.generateFailed'),
        description: await describeError(err),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };


  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          mode: 'send',
          title: title.trim(),
          message: message.trim(),
          link: null,
          departmentId: departmentId || null,
          roles,
          userIds: selectedUserIds,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: t('admin.broadcast.sent'),
        description: t('admin.broadcast.sentCount').replace(
          '{count}',
          String(data?.recipients ?? 0),
        ),
      });
      setRawText('');
      setTitle('');
      setMessage('');
      setGeneratedTitle('');
      setGeneratedMessage('');
      setSelectedUserIds([]);
      setPeopleSearch('');
      setConfirmOpen(false);
      // Delivery counters arrive asynchronously from the push trigger.
      queryClient.invalidateQueries({ queryKey: ['broadcast_campaigns'] });
      setTimeout(
        () => queryClient.invalidateQueries({ queryKey: ['broadcast_campaigns'] }),
        4000,
      );

    } catch (err) {
      toast({
        title: t('admin.broadcast.sendFailed'),
        description: await describeError(err),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Test-notifikation til administratorens egen telefon (kun admins ser knappen).
  const handleTestPush = async () => {
    setTesting(true);
    try {
      const result = await sendTest();
      toast({
        title: t('admin.broadcast.testSent'),
        description: t('admin.broadcast.testSentCount').replace(
          '{count}',
          String(result?.sent ?? 0),
        ),
      });
    } catch {
      toast({
        title: t('admin.broadcast.testFailed'),
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const notificationPreview = (
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {t('admin.broadcast.title')}
            </CardTitle>
            <CardDescription>{t('admin.broadcast.description')}</CardDescription>
          </div>
          {pushStatus === 'on' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="touch-target shrink-0"
              disabled={testing}
              onClick={() => void handleTestPush()}
            >
              {testing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              {t('admin.broadcast.testPush')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label>{t('admin.broadcast.department')}</Label>
            <Select value={departmentId || 'all'} onValueChange={(v) => setDepartmentId(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && <SelectItem value="all">{t('admin.broadcast.allDepartments')}</SelectItem>}
                {userDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="broadcast-text">{t('admin.broadcast.rawLabel')}</Label>
          <Textarea
            id="broadcast-text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder={t('admin.broadcast.rawPlaceholder')}
          />
        </div>




        <div className="space-y-2">
          <Label>{t('admin.broadcast.roles')}</Label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => (
              <Badge
                key={role}
                role="button"
                tabIndex={0}
                onClick={() => toggleRole(role)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleRole(role);
                  }
                }}
                variant={roles.includes(role) ? 'default' : 'secondary'}
                className="cursor-pointer touch-target"
              >
                {role}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('admin.broadcast.rolesHint')}</p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPeopleCollapsed((prev) => !prev)}
              aria-expanded={!peopleCollapsed}
              className="flex touch-target items-center gap-2 text-sm font-medium leading-none"
            >
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${peopleCollapsed ? '-rotate-90' : ''}`}
                aria-hidden
              />
              {t('admin.broadcast.people')}
              {selectedUserIds.length > 0 && (
                <Badge variant="secondary">{selectedUserIds.length}</Badge>
              )}
            </button>
            {selectedUserIds.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="touch-target"
                onClick={() => setSelectedUserIds([])}
              >
                {t('admin.broadcast.peopleClear')}
              </Button>
            )}
          </div>
          {!peopleCollapsed && (
            <>
              <Input
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                placeholder={t('admin.broadcast.peopleSearch')}
                aria-label={t('admin.broadcast.peopleSearch')}
              />
              <div className="max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-border/60">
            {peopleLoading && people.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                {t('admin.broadcast.recipientCountLoading')}
              </p>
            )}
            {!peopleLoading && filteredPeople.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                {t('admin.broadcast.peopleEmpty')}
              </p>
            )}
            {filteredPeople.map((person) => {
              const checked = selectedUserIds.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => toggleUser(person.id)}
                  aria-pressed={checked}
                  className={`flex w-full touch-target items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50 ${
                    checked ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                    }`}
                    aria-hidden
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {person.name || person.email}
                    </span>
                    {person.name && person.email && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {person.email}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
              </div>
            </>
          )}
        </div>


        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={generating || rawText.trim().length < 3}
            className="touch-target"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {t('admin.broadcast.generate')}
          </Button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {countLoading
              ? t('admin.broadcast.recipientCountLoading')
              : t('admin.broadcast.recipientCount').replace(
                  '{count}',
                  recipientCount === undefined ? '—' : String(recipientCount),
                )}
          </span>
        </div>

        {(title || message) && (
          <div className="space-y-4 rounded-xl border border-border/60 p-4">
            {notificationPreview}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="broadcast-title">{t('admin.broadcast.titleField')}</Label>
                <span
                  className={`text-xs ${title.length > TITLE_LIMIT ? 'text-warning' : 'text-muted-foreground'}`}
                >
                  {t('admin.broadcast.charsLeft')
                    .replace('{count}', String(title.length))
                    .replace('{max}', String(TITLE_LIMIT))}
                </span>
              </div>
              <Input
                id="broadcast-title"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="broadcast-message">{t('admin.broadcast.messageField')}</Label>
                <span
                  className={`text-xs ${message.length > MESSAGE_LIMIT ? 'text-warning' : 'text-muted-foreground'}`}
                >
                  {t('admin.broadcast.charsLeft')
                    .replace('{count}', String(message.length))
                    .replace('{max}', String(MESSAGE_LIMIT))}
                </span>
              </div>
              <Textarea
                id="broadcast-message"
                value={message}
                rows={3}
                maxLength={500}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={sending || !title.trim() || !message.trim()}
                className="touch-target"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t('admin.broadcast.send')}
              </Button>

              <Button
                variant="outline"
                className="touch-target"
                onClick={handleGenerate}
                disabled={generating || rawText.trim().length < 3}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('admin.broadcast.regenerate')}
              </Button>

              {hasEdits && (
                <Button
                  variant="ghost"
                  className="touch-target"
                  onClick={() => {
                    setTitle(generatedTitle);
                    setMessage(generatedMessage);
                  }}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  {t('admin.broadcast.resetEdits')}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !open && !sending && setConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.broadcast.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.broadcast.confirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {notificationPreview}
            <div className="rounded-lg border border-border/60 p-3 text-sm">
              <p className="text-muted-foreground">{t('admin.broadcast.audienceLabel')}</p>
              <p className="font-medium">{confirmAudience}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                {countLoading
                  ? t('admin.broadcast.recipientCountLoading')
                  : t('admin.broadcast.recipientCount').replace(
                      '{count}',
                      recipientCount === undefined ? '—' : String(recipientCount),
                    )}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="touch-target" disabled={sending}>
              {t('admin.broadcast.confirmCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="touch-target"
              disabled={sending}
              onClick={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.broadcast.confirmSend')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BroadcastNotification;
