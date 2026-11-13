// p360-link: viser en delt rundvisning uden login.
// Tjekker tokenet og giver tidsbegrænsede adresser til netop den rundvisnings billeder.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const HOURS = 12;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const { token } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || !/^[a-z0-9]{12,40}$/.test(token)) return json({ error: "not_found" }, 404);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
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
    return json({ tour: link.doc, scenes, urls, brand, expiresIn: HOURS * 3600 });
  } catch (_e) {
    return json({ error: "server" }, 500);
  }
});
