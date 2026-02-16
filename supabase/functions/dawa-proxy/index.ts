const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Route 1: Postcode lookup (?postnr=7120)
  const postnr = url.searchParams.get('postnr');
  if (postnr) {
    const trimmed = postnr.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      return new Response(JSON.stringify({ error: 'Invalid postnr format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const dawaUrl = `https://api.dataforsyningen.dk/postnumre/${trimmed}`;
      const res = await fetch(dawaUrl, {
        headers: { 'Accept-Encoding': 'identity' },
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Postnr not found' }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await res.text();
      return new Response(data, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'DAWA lookup failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Route 2: Address autocomplete (?q=...)
  const q = url.searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const dawaUrl = `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(q.trim())}&per_side=5`;

    const res = await fetch(dawaUrl, {
      headers: { 'Accept-Encoding': 'identity' },
    });

    if (!res.ok) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.text();

    return new Response(data, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
