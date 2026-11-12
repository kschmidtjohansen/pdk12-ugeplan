// p360-ai: analyserer 360-billeder for 3D-scanninger (kun redaktører).
//  kind "room": rumtype, etage, gulvhjørner, åbninger, trapper og indhold i ét billede.
//  kind "link": hvor i billede A stod stativet til billede B (og omvendt), til automatiske gulvringe, og om de to billeder er taget i samme rum.
// Billederne sendes fra browseren som JPEG med et koordinatgitter (0-1000) og gemmes ikke her.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const MAX_IMG = 4_500_000; // tegn i data-URL
const isImg = (v: unknown) => typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < MAX_IMG;
const num = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };

const GRID = "The image is a full 360° equirectangular photo with a light coordinate grid. x runs from 0 at the left edge to 1000 at the right edge; x=500 is straight ahead and both edges are the direction straight behind the camera. y runs from 0 at the top (straight up) to 1000 at the bottom (straight down); y=500 is the horizon, so the floor is always at y>500.";

const ROOM = (camH: number) => `${GRID}
The photo was taken inside a building in Denmark during a property damage survey, from a tripod with the lens about ${camH.toFixed(2)} m above the floor.
Answer with ONLY one JSON object, no markdown:
{"room": Danish room type, e.g. "Køkken", "Bryggers", "Stue", "Alrum", "Soveværelse", "Børneværelse", "Badeværelse", "Toilet", "Gang", "Entré", "Trapperum", "Kælder", "Loft", "Værksted", "Garage", "Udendørs",
 "level": floor level as an integer: -1 basement, 0 ground floor, 1 first floor, 2 second floor (0 if unsure; a loft room under the roof is the floor above the rooms below it),
 "corners": the floor corners of THIS room where two walls meet the floor, as [x,y] points ordered by increasing x; 4 points for a rectangular room, 6 or 8 for L-shaped rooms. Put each point exactly on the floor line. If a corner is hidden by furniture, estimate where the two floor lines would meet. Use [] if this is not an enclosed room,
 "openings": [{"type": "door" | "opening" | "window" | "stairs_up" | "stairs_down", "x": number}],
 "stairs": "none" | "up" | "down" | "both",
 "items": up to 40 contents worth listing for an insurance inventory (furniture, white goods, electronics, fixed installations, tools, larger personal items), each {"name": Danish name, "cat": one of "hvidevarer","møbler","elektronik","inventar","tekstiler","værktøj","andet", "count": integer, "x": number, "y": number} with x,y at the centre of the item; group identical items with a count,
 "notes": one short Danish sentence about visible damage (soot, water, mould, fire), or ""}`;

const LINK = `Both images use this format. ${GRID}
The two photos were taken in the same building from a tripod; photo B was taken right after photo A, usually a few metres away or in the next room.
Find in photo A the spot on the floor where the tripod of photo B stood, and in photo B the spot on the floor where the tripod of photo A stood. Use the furniture, doors and walls that both photos show to work it out. If the other position is not visible (for example round a corner or behind a door), point to the floor in the doorway or opening that leads there.
Also decide whether both photos were taken inside the same room (same floor area with no wall or doorway between the two tripods; an open kitchen-living area counts as one room only if there is no wall or partition between them).
Answer with ONLY one JSON object, no markdown:
{"a_to_b": {"x": number, "y": number}, "b_to_a": {"x": number, "y": number}, "same_room": true | false, "confidence": number between 0 and 1}`;

async function ask(key: string, model: string, prompt: string, images: string[]) {
  const content: unknown[] = [{ type: "text", text: prompt }];
  images.forEach((url, i) => { if (images.length > 1) content.push({ type: "text", text: i === 0 ? "Photo A:" : "Photo B:" }); content.push({ type: "image_url", image_url: { url } }); });
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model, reasoning_effort: "low", max_completion_tokens: 4000, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("p360-ai: gateway", res.status, detail.slice(0, 300));
    return { error: res.status === 429 ? "rate_limited" : res.status === 402 ? "payment_required" : "gateway_error", status: res.status === 429 ? 429 : res.status === 402 ? 402 : 502 };
  }
  const payload = await res.json().catch(() => null);
  const text = String(payload?.choices?.[0]?.message?.content ?? "");
  const m = text.match(/\{[\s\S]*\}/);
  try { return { data: JSON.parse(m ? m[0] : text) }; } catch { console.error("p360-ai: not json", text.slice(0, 200)); return { error: "bad_answer", status: 502 }; }
}

const pt = (p: any) => { const x = num(p?.x ?? p?.[0], 0, 1000), y = num(p?.y ?? p?.[1], 0, 1000); return x == null || y == null ? null : { x, y }; };
const CATS = new Set(["hvidevarer", "møbler", "elektronik", "inventar", "tekstiler", "værktøj", "andet"]);
const OPEN = new Set(["door", "opening", "window", "stairs_up", "stairs_down"]);
function cleanRoom(d: any) {
  const corners = (Array.isArray(d?.corners) ? d.corners : []).map(pt).filter((p: any) => p && p.y > 505).slice(0, 12);
  return {
    room: String(d?.room ?? "").slice(0, 40),
    level: Math.round(num(d?.level, -3, 9) ?? 0),
    corners: corners.length >= 3 ? corners : [],
    openings: (Array.isArray(d?.openings) ? d.openings : []).filter((o: any) => OPEN.has(o?.type)).map((o: any) => ({ type: o.type, x: num(o.x, 0, 1000) })).filter((o: any) => o.x != null).slice(0, 20),
    stairs: ["up", "down", "both"].includes(d?.stairs) ? d.stairs : "none",
    items: (Array.isArray(d?.items) ? d.items : []).slice(0, 40).map((it: any) => ({ name: String(it?.name ?? "").slice(0, 60), cat: CATS.has(it?.cat) ? it.cat : "andet", count: Math.round(num(it?.count, 1, 999) ?? 1), x: num(it?.x, 0, 1000), y: num(it?.y, 0, 1000) })).filter((it: any) => it.name),
    notes: String(d?.notes ?? "").slice(0, 300),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: canEdit, error: ce } = await sb.rpc("p360_can_edit");
    if (ce || canEdit !== true) return json({ error: "forbidden" }, 403);
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) { console.error("p360-ai: LOVABLE_API_KEY is not configured"); return json({ error: "missing_api_key" }, 500); }
    const model = Deno.env.get("P360_AI_MODEL") || "openai/gpt-6-astra";
    const body = await req.json().catch(() => ({}));
    if (body?.kind === "room") {
      if (!isImg(body.image)) return json({ error: "bad_image" }, 400);
      const r = await ask(key, model, ROOM(num(body.camHeight, 0.3, 4) ?? 1.5), [body.image]);
      if ("error" in r) return json({ error: r.error }, r.status);
      return json({ room: cleanRoom(r.data) });
    }
    if (body?.kind === "link") {
      if (!isImg(body.a) || !isImg(body.b)) return json({ error: "bad_image" }, 400);
      const r = await ask(key, model, LINK, [body.a, body.b]);
      if ("error" in r) return json({ error: r.error }, r.status);
      const ab = pt(r.data?.a_to_b), ba = pt(r.data?.b_to_a);
      if (!ab || !ba) return json({ error: "bad_answer" }, 502);
      return json({ link: { a_to_b: ab, b_to_a: ba, same_room: typeof r.data?.same_room === "boolean" ? r.data.same_room : null, confidence: num(r.data?.confidence, 0, 1) ?? 0.5 } });
    }
    return json({ error: "bad_kind" }, 400);
  } catch (e) {
    console.error("p360-ai: failed", (e as Error)?.message);
    return json({ error: "server" }, 500);
  }
});
