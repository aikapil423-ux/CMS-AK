import { useEffect, useState } from 'react';

interface FirIo {
  id: string;
  name: string;
  rank: string;
  pno: string;
  beltNumber: string;
  phone: string;
}

export function useFirIoRoster(station?: string, district?: string, enabled = true) {
  const scope = enabled && station && district ? new URLSearchParams({ station, district }).toString() : '';
  const [result, setResult] = useState<{ scope: string; officers: FirIo[]; error?: string }>();
  useEffect(() => {
    if (!scope) return;
    const controller = new AbortController();
    fetch(`/api/fir/io-roster?${scope}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load the IO roster.');
      if (!controller.signal.aborted) setResult({ scope, officers: data.officers });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ scope, officers: [], error: error.message });
    });
    return () => controller.abort();
  }, [scope]);

  const current = scope && result?.scope === scope ? result : undefined;
  return { officers: current?.officers || [], error: current?.error, loading: Boolean(scope && !current) };
}
