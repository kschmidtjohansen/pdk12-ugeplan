import { useEffect, useState } from 'react';

export type PwnedStatus = 'idle' | 'checking' | 'safe' | 'pwned' | 'unknown';

const sha1Hex = async (value: string): Promise<string> => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

/**
 * Checks a password against the Have I Been Pwned range API using k-anonymity:
 * only the first five characters of the SHA-1 hash ever leave the browser —
 * never the password itself. Network failures resolve to 'unknown' so the form
 * is not blocked; the server still validates on submit.
 */
export const usePwnedPasswordCheck = (password: string, enabled = true): PwnedStatus => {
  const [status, setStatus] = useState<PwnedStatus>('idle');

  useEffect(() => {
    if (!enabled || !password || password.length < 8) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    const timer = window.setTimeout(async () => {
      try {
        const hash = await sha1Hex(password);
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!res.ok) throw new Error('lookup failed');
        const text = await res.text();
        if (cancelled) return;
        const found = text
          .split('\n')
          .some((line) => line.split(':')[0]?.trim().toUpperCase() === suffix);
        setStatus(found ? 'pwned' : 'safe');
      } catch {
        if (!cancelled) setStatus('unknown');
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [password, enabled]);

  return status;
};
