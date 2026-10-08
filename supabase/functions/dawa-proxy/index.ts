// Address lookups via Datafordeleren (DAR GraphQL). DAWA was shut down (410 Gone).
// Responses keep the old DAWA-compatible shape so the frontend stays unchanged.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const GQL_URL = 'https://graphql.datafordeler.dk/DAR/v3';

// ETRS89 / UTM zone 32N (EPSG:25832) -> WGS84 lat/lng
function utm32ToLatLng(E: number, N: number): { lat: number; lng: number } {
  const a = 6378137, f = 1 / 298.257222101, k0 = 0.9996;
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const x = E - 500000, y = N;
  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const s = Math.sin(phi1), c = Math.cos(phi1), t = Math.tan(phi1);
  const N1 = a / Math.sqrt(1 - e2 * s * s);
  const T1 = t * t, C1 = ep2 * c * c;
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5);
  const D = x / (N1 * k0);
  const lat = phi1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lng = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
  return { lat: lat * 180 / Math.PI, lng: 9 + lng * 180 / Math.PI };
}

function parsePoint(wkt: unknown): { lat: number; lng: number } | null {
  if (typeof wkt !== 'string') return null;
  const m = wkt.match(/POINT\s*\(\s*([\d.]+)\s+([\d.]+)/i);
  if (!m) return null;
  const a = parseFloat(m[1]), b = parseFloat(m[2]);
  if (a > 1000) return utm32ToLatLng(a, b); // projected coords
  return { lat: b, lng: a };
}

// Parse "Vejnavn 12A, 7120 Vejle Øst"
function splitText(text: string) {
  const m = text.match(/^(.*?)\s+(\d+[A-Za-zÆØÅæøå]?)\b.*?,\s*(?:.*,\s*)?(\d{4})\s+(.+)$/);
  return m
    ? { vejnavn: m[1], husnr: m[2], postnr: m[3], postnrnavn: m[4] }
    : { vejnavn: text, husnr: '', postnr: '', postnrnavn: '' };
}

async function gql(query: string, variables: Record<string, unknown>) {
  const key = Deno.env.get('DATAFORDELER_API_KEY');
  if (!key) throw new Error('missing key');
  const res = await fetch(`${GQL_URL}?apiKey=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`datafordeler ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error('datafordeler query error: ' + String(body.errors[0]?.message ?? '').slice(0, 200));
  return body.data;
}

const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const lit = (s: string) => JSON.stringify(s);

async function fetchPoints(ids: string[], tid: string) {
  const points = new Map<string, { lat: number; lng: number }>();
  if (!ids.length) return points;
  const p = await gql(`{
    DAR_Adressepunkt(first: ${ids.length}, virkningstid: ${tid}, registreringstid: ${tid},
      where: { id_lokalId: { in: [${ids.map(lit).join(',')}] } }) {
      nodes { id_lokalId position { wkt } }
    }
  }`, {});
  for (const n of p?.DAR_Adressepunkt?.nodes ?? []) {
    const pt = parsePoint(n.position?.wkt ?? n.position);
    if (pt) points.set(n.id_lokalId, pt);
  }
  return points;
}

const norm = (s: string) => s.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Tolerant search: DAR only supports case-sensitive prefix matching, so we try
// normalised variants and, for free text like "vejlevej 10 vejle", search on
// "Vejlevej 10" and filter by the remaining words (postnr/by).
async function tolerantSearch(raw: string, limit: number) {
  const clean = raw.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
  const tried = new Set<string>();
  const attempt = async (prefix: string, n: number) => {
    if (!prefix || tried.has(prefix)) return [];
    tried.add(prefix);
    return searchAddresses(prefix, n);
  };
  let r = await attempt(clean, limit);
  if (r.length) return r;
  r = await attempt(capFirst(clean), limit);
  if (r.length) return r;
  const m = clean.match(/^(.*?\D)\s*(\d+\s?[A-Za-zÆØÅæøå]?)\b[\s,]*(.*)$/);
  if (m) {
    const base = capFirst(`${m[1].trim()} ${m[2].replace(/\s/g, '').toUpperCase()}`);
    const rest = norm(m[3]).split(' ').filter(w => w.length > 1);
    const cands = await attempt(base, rest.length ? 100 : limit);
    const hit = rest.length ? cands.filter(c => rest.every(w => norm(c.tekst).includes(w))) : cands;
    if (hit.length) return hit.slice(0, limit);
    // Fall back to unfiltered matches on street + number if the town part didn't match.
    if (cands.length && rest.length) return cands.slice(0, limit);
  }
  return [];
}

async function searchAddresses(text: string, limit: number, mode: 'startsWith' | 'contains' = 'startsWith') {
  const tid = lit(now());
  const data = await gql(`{
    DAR_Husnummer(first: ${limit}, virkningstid: ${tid}, registreringstid: ${tid},
      where: { adgangsadressebetegnelse: { ${mode}: ${lit(text)} }, status: { eq: "3" } }) {
      nodes { id_lokalId adgangsadressebetegnelse adgangspunkt }
    }
  }`, {});
  const nodes: Array<{ id_lokalId: string; adgangsadressebetegnelse: string; adgangspunkt?: string }> =
    data?.DAR_Husnummer?.nodes ?? [];
  const points = await fetchPoints(nodes.map(n => n.adgangspunkt).filter(Boolean) as string[], tid);
  return nodes.map(n => {
    const pt = n.adgangspunkt ? points.get(n.adgangspunkt) : undefined;
    return {
      tekst: n.adgangsadressebetegnelse,
      adresse: {
        ...splitText(n.adgangsadressebetegnelse),
        x: pt?.lng, y: pt?.lat,
        adgangspunkt: pt ? { koordinater: [pt.lng, pt.lat] } : undefined,
      },
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);

  // Route 1: full address -> coordinates
  const address = url.searchParams.get('adresse');
  if (address) {
    const trimmed = address.trim();
    if (trimmed.length < 3 || trimmed.length > 300) return json({ error: 'Invalid address' }, 400);
    try {
      const [first] = await tolerantSearch(trimmed, 1);
      if (first?.adresse.y == null) return json({ error: 'Address not found' }, 404);
      return json({ lng: first.adresse.x, lat: first.adresse.y });
    } catch {
      return json({ error: 'Address lookup failed' }, 502);
    }
  }

  // Route 2: postcode -> DAWA-like { nr, navn, visueltcenter: [lng, lat] }
  const postnr = url.searchParams.get('postnr');
  if (postnr) {
    const trimmed = postnr.trim();
    if (!/^\d{4}$/.test(trimmed)) return json({ error: 'Invalid postnr format' }, 400);
    try {
      const tid = lit(now());
      const pd = await gql(`{ DAR_Postnummer(first: 1, virkningstid: ${tid}, registreringstid: ${tid}, where: { postnr: { eq: ${lit(trimmed)} } }) { nodes { id_lokalId navn } } }`, {});
      const pn = pd?.DAR_Postnummer?.nodes?.[0];
      if (!pn) return json({ error: 'Postnr not found' }, 404);
      // Centre = median of up to 100 address points in the postcode (robust to outliers).
      const hd = await gql(`{ DAR_Husnummer(first: 100, virkningstid: ${tid}, registreringstid: ${tid}, where: { postnummer: { eq: ${lit(pn.id_lokalId)} }, status: { eq: "3" } }) { nodes { adgangspunkt } } }`, {});
      const ids = (hd?.DAR_Husnummer?.nodes ?? []).map((n: { adgangspunkt?: string }) => n.adgangspunkt).filter(Boolean);
      const pts = [...(await fetchPoints(ids, tid)).values()];
      if (!pts.length) return json({ error: 'Postnr not found' }, 404);
      const med = (a: number[]) => { const v = [...a].sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
      return json({ nr: trimmed, navn: pn.navn, visueltcenter: [med(pts.map(p => p.lng)), med(pts.map(p => p.lat))] });
    } catch (e) {
      return json({ error: 'Postnr lookup failed' }, 502);
    }
  }

  // Route 3: autocomplete
  const q = url.searchParams.get('q')?.trim();
  if (!q || q.length < 2 || q.length > 200) return json([]);
  try {
    return json(await tolerantSearch(q, 8));
  } catch (e) {
    console.error('autocomplete failed:', (e as Error).message);
    return json([], 502);
  }
});
