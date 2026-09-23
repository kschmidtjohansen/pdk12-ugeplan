import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Sparkles, Send, Loader2, Bell, RotateCcw, Undo2, Users } from 'lucide-react';

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

const TITLE_LIMIT = 45;
const MESSAGE_LIMIT = 130;

const ROLE_OPTIONS = [
  'servicemedarbejder',
  'fugttekniker',
  'skadeleder',
  'vikar',
  'administrator',
] as const;

const LINK_OPTIONS = ['', '/planner', '/duty', '/vacation', '/dashboard'] as const;

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
  const [link, setLink] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const { data: recipientCount, isFetching: countLoading } = useQuery({
    queryKey: ['broadcast_recipient_count', departmentId, debouncedRolesKey],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          mode: 'preview_recipients',
          departmentId: departmentId || null,
          roles: debouncedRolesKey ? debouncedRolesKey.split(',') : [],
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
          link: link || null,
          departmentId: departmentId || null,
          roles,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          {t('admin.broadcast.title')}
        </CardTitle>
        <CardDescription>{t('admin.broadcast.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label>{t('admin.broadcast.link')}</Label>
            <Select value={link || 'none'} onValueChange={(v) => setLink(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('admin.broadcast.noLink')}</SelectItem>
                {LINK_OPTIONS.filter(Boolean).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

        <Button onClick={handleGenerate} disabled={generating || rawText.trim().length < 3}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {t('admin.broadcast.generate')}
        </Button>

        {(title || message) && (
          <div className="space-y-4 rounded-xl border border-border/60 p-4">
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="broadcast-title">{t('admin.broadcast.titleField')}</Label>
              <Input
                id="broadcast-title"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-message">{t('admin.broadcast.messageField')}</Label>
              <Textarea
                id="broadcast-message"
                value={message}
                rows={3}
                maxLength={500}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t('admin.broadcast.send')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BroadcastNotification;
