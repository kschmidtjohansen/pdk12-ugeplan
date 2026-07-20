// Auto-fjern medarbejder fra opgaver ved fravær (ferie, on_leave, kursus).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Reason = "approved_vacation" | "on_leave" | "training";

interface Body {
  vacationId?: string;
  userId?: string;
  startDate?: string; // yyyy-mm-dd
  endDate?: string;   // yyyy-mm-dd
  reason?: Reason;
}

function timesOverlap(
  aStart: string | null | undefined,
  aEnd: string | null | undefined,
  bStart: string | null | undefined,
  bEnd: string | null | undefined,
): boolean {
  const s1 = aStart || "00:00:00";
  const e1 = aEnd || "23:59:59";
  const s2 = bStart || "00:00:00";
  const e2 = bEnd || "23:59:59";
  return s1 < e2 && s2 < e1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  const log = (...args: unknown[]) => console.log(`[vacation-cleanup ${requestId}]`, ...args);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const callerId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    // Determine parameters
    let userId: string;
    let startDate: string;
    let endDate: string;
    let isPartial = false;
    let partialStartTime: string | null = null;
    let partialEndTime: string | null = null;
    let reason: Reason = "approved_vacation";
    let vacationId: string | null = null;

    if (body.vacationId) {
      const { data: vacation, error: vacErr } = await admin
        .from("vacations")
        .select("id, user_id, start_date, end_date, start_time, end_time, status, request_type")
        .eq("id", body.vacationId)
        .maybeSingle();
      if (vacErr) throw vacErr;
      if (!vacation) {
        return new Response(
          JSON.stringify({ error: "Vacation not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (vacation.status !== "approved") {
        return new Response(
          JSON.stringify({ error: "Vacation is not approved" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      userId = vacation.user_id;
      startDate = vacation.start_date;
      endDate = vacation.end_date;
      isPartial = vacation.request_type === "partial_day";
      partialStartTime = vacation.start_time;
      partialEndTime = vacation.end_time;
      vacationId = vacation.id;
    } else if (body.userId && body.startDate && body.endDate) {
      userId = body.userId;
      startDate = body.startDate;
      endDate = body.endDate;
      reason = body.reason ?? "on_leave";
    } else {
      return new Response(
        JSON.stringify({ error: "Provide vacationId or (userId + startDate + endDate)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    log("Processing cleanup", { userId, startDate, endDate, reason, isPartial });

    const { data: employee } = await admin
      .from("profiles").select("name").eq("id", userId).maybeSingle();
    const employeeName: string = (employee as any)?.name || "Medarbejder";

    const { data: callerProfile } = await admin
      .from("profiles").select("name, first_name").eq("id", callerId).maybeSingle();
    const changedByName: string = (callerProfile as any)?.name || "System";
    const changedByFirstName: string = (callerProfile as any)?.first_name || "System";

    // 1) assignments_employees rows in period
    const { data: aeRows, error: aeErr } = await admin
      .from("assignments_employees")
      .select(
        "assignment_id, user_id, assignments!inner(id, assignment_date, from_time, to_time, title, case_number, responsible_user_id, published)",
      )
      .eq("user_id", userId)
      .gte("assignments.assignment_date", startDate)
      .lte("assignments.assignment_date", endDate);
    if (aeErr) throw aeErr;

    // 2) responsible rows
    const { data: respRows, error: respErr } = await admin
      .from("assignments")
      .select("id, assignment_date, from_time, to_time, title, case_number, responsible_user_id, published")
      .eq("responsible_user_id", userId)
      .gte("assignment_date", startDate)
      .lte("assignment_date", endDate);
    if (respErr) throw respErr;

    const overlaps = (a: any) =>
      !isPartial || timesOverlap(partialStartTime, partialEndTime, a.from_time, a.to_time);

    const aeToDelete = (aeRows || []).filter((r: any) => overlaps(r.assignments));
    const respToClear = (respRows || []).filter((r: any) => overlaps(r));

    log(`Found ${aeToDelete.length} ae rows and ${respToClear.length} resp rows`);

    const removedAssignments: Array<{
      id: string; case_number: string | null; title: string | null; date: string; responsible_user_id: string | null;
    }> = [];

    for (const row of aeToDelete) {
      const { error: delErr } = await admin
        .from("assignments_employees").delete()
        .eq("assignment_id", row.assignment_id).eq("user_id", userId);
      if (delErr) { log("delete failed", row.assignment_id, delErr.message); continue; }
      const a = row.assignments;
      removedAssignments.push({
        id: a.id, case_number: a.case_number, title: a.title,
        date: a.assignment_date, responsible_user_id: a.responsible_user_id,
      });
    }

    const clearedResponsible: typeof removedAssignments = [];
    for (const a of respToClear) {
      const { error: updErr } = await admin
        .from("assignments")
        .update({ responsible_user_id: null, updated_at: new Date().toISOString() })
        .eq("id", a.id);
      if (updErr) { log("clear resp failed", a.id, updErr.message); continue; }
      clearedResponsible.push({
        id: a.id, case_number: a.case_number, title: a.title,
        date: a.assignment_date, responsible_user_id: a.responsible_user_id,
      });
    }

    // change log
    const opUnassign =
      reason === "training" ? "auto_unassign_training"
      : reason === "on_leave" ? "auto_unassign_on_leave"
      : "auto_unassign_vacation";
    const opClear =
      reason === "training" ? "auto_clear_responsible_training"
      : reason === "on_leave" ? "auto_clear_responsible_on_leave"
      : "auto_clear_responsible_vacation";

    const commonDetails = {
      reason,
      vacation_id: vacationId,
      removed_user_id: userId,
      removed_user_name: employeeName,
      period_start: startDate,
      period_end: endDate,
    };

    const logRows: any[] = [];
    for (const a of removedAssignments) {
      logRows.push({
        assignment_id: a.id, operation: opUnassign,
        changed_by: callerId, changed_by_name: changedByName, changed_by_first_name: changedByFirstName,
        change_details: commonDetails,
      });
    }
    for (const a of clearedResponsible) {
      logRows.push({
        assignment_id: a.id, operation: opClear,
        changed_by: callerId, changed_by_name: changedByName, changed_by_first_name: changedByFirstName,
        change_details: { ...commonDetails, cleared_responsible_user_id: userId, cleared_responsible_user_name: employeeName },
      });
    }
    if (logRows.length > 0) {
      const { error: logErr } = await admin.from("planner_change_log").insert(logRows);
      if (logErr) log("planner_change_log insert failed", logErr.message);
    }

    // Notify skadeledere
    const respBuckets = new Map<string, typeof removedAssignments>();
    for (const a of removedAssignments) {
      if (!a.responsible_user_id || a.responsible_user_id === userId) continue;
      const arr = respBuckets.get(a.responsible_user_id) || [];
      arr.push(a);
      respBuckets.set(a.responsible_user_id, arr);
    }

    const reasonText =
      reason === "training" ? "kursus"
      : reason === "on_leave" ? "fravær"
      : "godkendt fri";

    const notifications: any[] = [];
    for (const [respUserId, list] of respBuckets) {
      notifications.push({
        user_id: respUserId,
        type: "vacation",
        title: "Medarbejder fjernet fra opgaver",
        message: `${employeeName} er fjernet fra ${list.length} opgave${list.length === 1 ? "" : "r"} pga. ${reasonText} (${startDate}${
          startDate === endDate ? "" : `–${endDate}`
        }).`,
        link: "/planner",
        read: false,
      });
    }
    if (notifications.length > 0) {
      const { error: notifErr } = await admin.from("notifications").insert(notifications);
      if (notifErr) log("notifications insert failed", notifErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        removedFromCount: removedAssignments.length,
        clearedResponsibleCount: clearedResponsible.length,
        notifiedResponsibleUsers: respBuckets.size,
        affectedAssignments: removedAssignments,
        reason,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = (err as any)?.message || String(err);
    console.error(`[vacation-cleanup ${requestId}] ERROR`, message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
