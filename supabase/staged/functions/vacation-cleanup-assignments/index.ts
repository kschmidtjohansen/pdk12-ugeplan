// STAGED — not deployed. Replaces supabase/functions/vacation-cleanup-assignments/index.ts
// Requires staged SQL: security_effective_permission_for, apply_absence_cleanup.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { json, loadDeptIds, requireCaller, serviceClient } from '../_shared/caller.ts';
import { authorizeAbsenceCleanup, parseAbsenceRequest, type AbsenceReason } from '../_shared/policies.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const admin = serviceClient();
    const caller = await requireCaller(req, admin);
    if (caller instanceof Response) return caller;

    const parsed = parseAbsenceRequest(await req.json().catch(() => null));
    if (!parsed.ok) return json(400, { error: parsed.code });
    const r = parsed.value;

    let userId: string, startDate: string, endDate: string;
    let reason: AbsenceReason;
    let vacationId: string | null = null;
    let isPartial = false, partialStart: string | null = null, partialEnd: string | null = null;

    if (r.mode === 'vacation') {
      const { data: v, error } = await admin.from('vacations')
        .select('id, user_id, start_date, end_date, start_time, end_time, status, request_type')
        .eq('id', r.vacationId).maybeSingle();
      if (error) return json(500, { error: 'lookup_failed' });
      if (!v) return json(404, { error: 'vacation_not_found' });
      if (v.status !== 'approved') return json(409, { error: 'vacation_not_approved' });
      userId = v.user_id; startDate = v.start_date; endDate = v.end_date;
      isPartial = v.request_type === 'partial_day';
      partialStart = v.start_time; partialEnd = v.end_time;
      vacationId = v.id; reason = 'approved_vacation';
    } else {
      userId = r.userId; startDate = r.startDate; endDate = r.endDate; reason = r.reason;
      // Evidence: the absence must actually be registered before colleagues are unassigned.
      if (reason === 'sick') {
        const { count, error } = await admin.from('sick_days').select('id', { count: 'exact', head: true })
          .eq('user_id', userId).gte('sick_date', startDate).lte('sick_date', endDate);
        if (error) return json(500, { error: 'lookup_failed' });
        if (!count) return json(409, { error: 'absence_not_registered' });
      } else if (reason === 'training') {
        const { count, error } = await admin.from('trainings').select('id', { count: 'exact', head: true })
          .eq('user_id', userId).lte('start_date', startDate).gte('end_date', endDate);
        if (error) return json(500, { error: 'lookup_failed' });
        if (!count) return json(409, { error: 'absence_not_registered' });
      } else {
        const { data: p, error } = await admin.from('profiles').select('status, on_leave').eq('id', userId).maybeSingle();
        if (error) return json(500, { error: 'lookup_failed' });
        if (!p || !(p.status === 'on_leave' || p.on_leave === true)) return json(409, { error: 'absence_not_registered' });
      }
    }

    const { data: canApprove, error: permErr } = await admin.rpc('security_effective_permission_for', {
      p_user_id: caller.id, p_permission: 'approve_vacations',
    });
    if (permErr) return json(500, { error: 'authorization_lookup_failed' });

    let targetDeptIds: string[];
    try { targetDeptIds = await loadDeptIds(admin, userId); } catch { return json(500, { error: 'authorization_lookup_failed' }); }

    const decision = authorizeAbsenceCleanup({
      callerRoles: caller.roles, callerCanApproveVacations: canApprove === true,
      callerDeptIds: caller.deptIds, targetDeptIds, reason,
    });
    if (!decision.ok) {
      console.warn(`[vacation-cleanup ${requestId}] denied ${decision.code}`);
      return json(decision.status, { error: decision.code });
    }

    // One transaction: unassign, clear responsible, change log, notifications.
    const { data: result, error: rpcErr } = await admin.rpc('apply_absence_cleanup', {
      p_user_id: userId, p_start: startDate, p_end: endDate,
      p_is_partial: isPartial, p_partial_start: partialStart, p_partial_end: partialEnd,
      p_reason: reason, p_vacation_id: vacationId, p_changed_by: caller.id,
    });
    if (rpcErr) {
      console.error(`[vacation-cleanup ${requestId}] apply failed`, rpcErr.code);
      return json(500, { error: 'cleanup_failed' });
    }
    return json(200, { success: true, reason, ...(result as Record<string, unknown>) });
  } catch (err) {
    console.error(`[vacation-cleanup ${requestId}] error`, (err as { message?: string })?.message);
    return json(500, { error: 'internal_error' });
  }
});
