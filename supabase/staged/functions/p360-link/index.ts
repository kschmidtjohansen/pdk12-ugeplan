// p360-link: viser en delt rundvisning uden login.
// Tjekker tokenet og giver tidsbegrænsede adresser til netop den rundvisnings billeder.
// Tæller også visninger i p360_link_views: en række pr. åbning (tid, rum og skærmtype, ingen IP eller browser),
// som fremviseren holder ved lige med et lille "stadig her" hvert 20. sekund, mens fanen er synlig.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const HOURS = 12;
const MAX_SECONDS = 4 * 3600;
const DEVICES = new Set(["computer", "tablet", "phone"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const { token } = body ?? {};
    if (typeof token !== "string" || !/^[a-z0-9]{12,40}$/.test(token)) return json({ error: "not_found" }, 404);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    // "still here" from an open viewer: only raises time and rooms, and never past the time since the link was opened
    if (body.view !== undefined) {
      if (typeof body.view !== "string" || !UUID.test(body.view)) return json({ ok: false });
      const { data: v } = await sb.from("p360_link_views").select("opened_at, seconds, rooms").eq("id", body.view).eq("token", token).maybeSingle();
      if (!v) return json({ ok: false });
      const since = Math.floor((Date.now() - Date.parse(v.opened_at)) / 1000) + 5;
      const sec = Math.min(MAX_SECONDS, since, Math.max(v.seconds, Math.floor(Number(body.seconds) || 0)));
      const { count: nScenes } = await sb.from("p360_link_scenes").select("id", { count: "exact", head: true }).eq("token", token);
      const rooms = Math.min(Math.max(1, nScenes ?? 1), 500, Math.max(v.rooms, Math.floor(Number(body.rooms) || 0)));
      await sb.from("p360_link_views").update({ seconds: sec, rooms, seen_at: new Date().toISOString() }).eq("id", body.view).eq("token", token);
      return json({ ok: true });
    }
    const { data: link, error } = await sb.from("p360_links").select("doc").eq("token", token).maybeSingle();
    if (error) throw error;
    if (!link) return json({ error: "not_found" }, 404);
    // links made after 12-11-2026 carry an expiry (90 days); older links have none and keep working
    const exp = Number((link.doc as Record<string, unknown>)?.expiresAt);
    if (Number.isFinite(exp) && exp > 0 && exp < Date.now()) return json({ error: "expired" }, 410);
    const { data: rows, error: e2 } = await sb.from("p360_link_scenes").select("id, doc").eq("token", token);
    if (e2) throw e2;
    const scenes = (rows ?? []).map((r: { id: string; doc: Record<string, unknown> }) => ({ ...r.doc, id: r.id }));
    const paths = new Set<string>();
    for (const sc of scenes as Array<Record<string, any>>) {
      if (typeof sc.asset === "string") paths.add(sc.asset);
      for (const h of sc.hotspots ?? []) if (typeof h?.photo === "string") paths.add(h.photo);
    }
    const plan = (link.doc as Record<string, any>)?.plan;
    if (plan && typeof plan.asset === "string") paths.add(plan.asset);
    const urls: Record<string, string> = {};
    if (paths.size) {
      const { data: signed, error: e3 } = await sb.storage.from("p360").createSignedUrls([...paths], HOURS * 3600);
      if (e3) throw e3;
      for (const s of signed ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    }
    const { data: cfg } = await sb.from("p360_config").select("doc").eq("id", 1).maybeSingle();
    const c = (cfg?.doc ?? {}) as Record<string, unknown>;
    const brand = { name: c.company, logo: c.logo, accent: c.accent, nadir: c.nadir, nadirOn: c.nadirOn, nadirSize: c.nadirSize };
    // count the visit; if the statistics table is not there yet, the link still works
    let view: string | null = null;
    if (body.count !== false) {
      const device = DEVICES.has(body.device) ? body.device : "computer";
      const { data: vr } = await sb.from("p360_link_views").insert({ token, device }).select("id").maybeSingle();
      view = vr?.id ?? null;
    }
    return json({ tour: link.doc, scenes, urls, brand, expiresIn: HOURS * 3600, view });
  } catch (_e) {
    return json({ error: "server" }, 500);
  }
});
