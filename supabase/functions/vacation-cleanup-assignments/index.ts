// Automatisk fjernelse af medarbejder fra opgaver der overlapper en godkendt fri-anmodning.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  vacationId: string;
}

// Returnerer true hvis tidsintervaller [aStart,aEnd) og [bStart,bEnd) overlapper.
// Hvis et tidspunkt mangler, antages "hele dagen" (00:00 - 23:59:59).
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
    if (!body?.vacationId) {
      return new Response(
        JSON.stringify({ error: "vacationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify caller via anon key + auth header
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

    // Admin client for cross-RLS operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Load vacation
    const { data: vacation, error: vacErr } = await admin
      .from("vacations")
      .select("id, user_id, start_date, end_date, start_time, end_time, status, request_type, is_same_day")
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

    const userId: string = vacation.user_id;
    const startDate: string = vacation.start_date;
    const endDate: string = vacation.end_date;
    const isPartial = vacation.request_type === "partial_day";

    log("Processing vacation", { vacationId: vacation.id, userId, startDate, endDate, isPartial });

    // Load employee name for notifications
    const { data: employee } = await admin
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();
    const employeeName: string = (employee as any)?.name || "Medarbejder";

    // Caller display name for change log
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("name, first_name")
      .eq("id", callerId)
      .maybeSingle();
    const changedByName: string = (callerProfile as any)?.name || "System";
    const changedByFirstName: string = (callerProfile as any)?.first_name || "System";

    // 1) Find assignments_employees rows in period
    const { data: aeRows, error: aeErr } = await admin
      .from("assignments_employees")
      .select(
        "assignment_id, user_id, assignments!inner(id, assignment_date, from_time, to_time, title, case_number, responsible_user_id, published)",
      )
      .eq("user_id", userId)
      .gte("assignments.assignment_date", startDate)
      .lte("assignments.assignment_date", endDate);

    if (aeErr) throw aeErr;

    // 2) Find assignments where user is responsible
    const { data: respRows, error: respErr } = await admin
      .from("assignments")
      .select("id, assignment_date, from_time, to_time, title, case_number, responsible_user_id, published")
      .eq("responsible_user_id", userId)
      .gte("assignment_date", startDate)
      .lte("assignment_date", endDate);

    if (respErr) throw respErr;

    // Filter overlap when partial_day
    const overlaps = (a: any) =>
      !isPartial || timesOverlap(vacation.start_time, vacation.end_time, a.from_time, a.to_time);

    const aeToDelete = (aeRows || []).filter((r: any) => overlaps(r.assignments));
    const respToClear = (respRows || []).filter((r: any) => overlaps(r));

    log(`Found ${aeToDelete.length} assignment-employee rows and ${respToClear.length} responsible rows to clean`);

    // 3) Delete assignments_employees rows
    const removedAssignments: Array<{
      id: string;
      case_number: string | null;
      title: string | null;
      date: string;
      responsible_user_id: string | null;
    }> = [];

    for (const row of aeToDelete) {
      const { error: delErr } = await admin
        .from("assignments_employees")
        .delete()
        .eq("assignment_id", row.assignment_id)
        .eq("user_id", userId);
      if (delErr) {
        log("Failed to delete assignments_employees", row.assignment_id, delErr.message);
        continue;
      }
      const a = row.assignments;
      removedAssignments.push({
        id: a.id,
        case_number: a.case_number,
        title: a.title,
        date: a.assignment_date,
        responsible_user_id: a.responsible_user_id,
      });
    }

    // 4) Clear responsible_user_id where applicable
    const clearedResponsible: typeof removedAssignments = [];
    for (const a of respToClear) {
      const { error: updErr } = await admin
        .from("assignments")
        .update({ responsible_user_id: null, updated_at: new Date().toISOString() })
        .eq("id", a.id);
      if (updErr) {
        log("Failed to clear responsible_user_id", a.id, updErr.message);
        continue;
      }
      clearedResponsible.push({
        id: a.id,
        case_number: a.case_number,
        title: a.title,
        date: a.assignment_date,
        responsible_user_id: a.responsible_user_id,
      });
    }

    // 5) Insert planner_change_log entries
    const logRows: any[] = [];
    for (const a of removedAssignments) {
      logRows.push({
        assignment_id: a.id,
        operation: "auto_unassign_vacation",
        changed_by: callerId,
        changed_by_name: changedByName,
        changed_by_first_name: changedByFirstName,
        change_details: {
          reason: "approved_vacation",
          vacation_id: vacation.id,
          removed_user_id: userId,
          removed_user_name: employeeName,
          vacation_start: startDate,
          vacation_end: endDate,
        },
      });
    }
    for (const a of clearedResponsible) {
      logRows.push({
        assignment_id: a.id,
        operation: "auto_clear_responsible_vacation",
        changed_by: callerId,
        changed_by_name: changedByName,
        changed_by_first_name: changedByFirstName,
        change_details: {
          reason: "approved_vacation",
          vacation_id: vacation.id,
          cleared_responsible_user_id: userId,
          cleared_responsible_user_name: employeeName,
          vacation_start: startDate,
          vacation_end: endDate,
        },
      });
    }
    if (logRows.length > 0) {
      const { error: logErr } = await admin.from("planner_change_log").insert(logRows);
      if (logErr) log("Failed to insert planner_change_log", logErr.message);
    }

    // 6) Notify affected skadeledere (one aggregated message per responsible user)
    const respBuckets = new Map<string, typeof removedAssignments>();
    for (const a of removedAssignments) {
      if (!a.responsible_user_id || a.responsible_user_id === userId) continue;
      const arr = respBuckets.get(a.responsible_user_id) || [];
      arr.push(a);
      respBuckets.set(a.responsible_user_id, arr);
    }

    const notifications: any[] = [];
    for (const [respUserId, list] of respBuckets) {
      notifications.push({
        user_id: respUserId,
        type: "vacation",
        title: "Medarbejder fjernet fra opgaver",
        message: `${employeeName} er fjernet fra ${list.length} opgave${list.length === 1 ? "" : "r"} pga. godkendt fri (${startDate}${
          startDate === endDate ? "" : `–${endDate}`
        }).`,
        link: "/planner",
        read: false,
      });
    }
    if (notifications.length > 0) {
      const { error: notifErr } = await admin.from("notifications").insert(notifications);
      if (notifErr) log("Failed to insert notifications", notifErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        removedFromCount: removedAssignments.length,
        clearedResponsibleCount: clearedResponsible.length,
        notifiedResponsibleUsers: respBuckets.size,
        affectedAssignments: removedAssignments,
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
