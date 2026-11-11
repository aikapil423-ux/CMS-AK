"use client";

import { useEffect, useRef, useState } from 'react';
import { writeCaseDraft } from '@/lib/caseWritingClient';

type Props = Parameters<typeof writeCaseDraft>[0] & {
  onDraft: (text: string) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export function CaseDraftButton({ onDraft, disabled, onBusyChange, ...input }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function draft() {
    setBusy(true);
    onBusyChange?.(true);
    setError('');
    try {
      const text = await writeCaseDraft(input);
      if (active.current) onDraft(text);
    } catch (error) {
      if (active.current) setError(error instanceof Error ? error.message : 'AI draft failed.');
    } finally {
      if (active.current) setBusy(false);
      onBusyChange?.(false);
    }
  }

  return <span className="inline-flex flex-wrap items-center gap-2">
    <button type="button" disabled={busy || disabled} className="rounded border px-3 py-2 text-xs font-semibold disabled:opacity-50" onClick={draft}>
      {busy ? 'Drafting from saved records…' : 'Draft with AI'}
    </button>
    {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
  </span>;
}
