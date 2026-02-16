import { useState, useEffect, useRef } from 'react';

export interface DawaSuggestion {
  tekst: string;
  adresse: {
    vejnavn: string;
    husnr: string;
    postnr: string;
    postnrnavn: string;
    adgangspunkt?: {
      koordinater: [number, number]; // [lng, lat]
    };
  };
}

export const useDawaAutocomplete = (query: string) => {
  const [suggestions, setSuggestions] = useState<DawaSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch(
          `https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/dawa-proxy?q=${encodeURIComponent(query.trim())}`,
          { signal: abortRef.current.signal }
        );

        if (!res.ok) {
          setSuggestions([]);
          return;
        }

        const data = await res.json();
        setSuggestions(data as DawaSuggestion[]);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  return { suggestions, isLoading };
};
