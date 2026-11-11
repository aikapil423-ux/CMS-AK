"use client";

import { useCallback, useEffect, useState } from 'react';
import { firPersistence } from '@/services/persistentFirService';
import type { CustodyUnit, RecordTransfer } from '@/lib/recordCustody';

type Row = {
  kind: 'FIR' | 'COMPLAINT';
  id: string;
  reference: string;
  unit?: CustodyUnit;
  canRequest: boolean;
  transfers: (RecordTransfer & { canDecide: boolean })[];
};
type Action = { row: Row; transferId?: string };
const control = 'rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
const button = 'rounded bg-blue-800 px-3 py-2 text-sm text-white disabled:opacity-50';

export default function RecordTransfersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [units, setUnits] = useState<CustodyUnit[]>([]);
  const [selected, setSelected] = useState<Action | null>(null);
  const [destinationId, setDestination] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    const response = await fetch('/api/record-transfers', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Transfers could not be loaded.');
    setRows(data.rows);
    setUnits(data.units);
  }, []);
  useEffect(() => { refresh().catch(error => setMessage(error.message)); }, [refresh]);

  function open(action: Action) {
    setSelected(action);
    setDestination('');
    setNote('');
    setMessage('');
  }

  async function submit(decision?: 'APPROVED' | 'REJECTED') {
    if (!selected || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { row, transferId } = selected;
      const common = { kind: row.kind, recordId: row.id };
      const payload = transferId
        ? { ...common, action: 'decide', transferId, decision, note }
        : { ...common, action: 'request', destinationId, reason: note };
      const response = await fetch('/api/record-transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Transfer could not be saved.');
      setSelected(null);
      setMessage(decision === 'APPROVED' ? 'Record custody transferred.' : decision === 'REJECTED' ? 'Request rejected.' : 'Request sent for approval.');
      await refresh();
      if (decision === 'APPROVED' && row.kind === 'FIR') await firPersistence.refresh().catch(() => {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transfer could not be saved.');
    } finally { setBusy(false); }
  }

  return <section className="mx-auto max-w-5xl space-y-4 text-slate-900">
    <h1 className="text-2xl font-bold">Record transfers</h1>
    <p className="text-sm">Request or review a custody transfer for an FIR or complaint.</p>
    {message && <p role="status" className="rounded border bg-white p-3">{message}</p>}
    {selected && <form className="space-y-3 rounded border bg-white p-4" onSubmit={event => { event.preventDefault(); if (!selected.transferId) void submit(); }}>
      <h2 className="font-semibold">{selected.row.reference}</h2>
      {!selected.transferId && <label className="block text-sm">Destination station or office
        <select required className={control + ' block w-full'} value={destinationId} onChange={event => setDestination(event.target.value)}>
          <option value="">Choose destination</option>
          {units.filter(unit => unit.id !== selected.row.unit?.id).map(unit => <option key={unit.id} value={unit.id}>{unit.name} · {unit.district}</option>)}
        </select>
      </label>}
      <label className="block text-sm">{selected.transferId ? 'Decision note' : 'Reason'}
        <textarea required maxLength={1000} className={control + ' block w-full'} value={note} onChange={event => setNote(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {selected.transferId ? <>
          <button type="button" className={button} disabled={busy || !note.trim()} onClick={() => void submit('APPROVED')}>Approve and transfer</button>
          <button type="button" className={control} disabled={busy || !note.trim()} onClick={() => void submit('REJECTED')}>Reject</button>
        </> : <button className={button} disabled={busy || !destinationId || !note.trim()}>Send for approval</button>}
        <button type="button" className={control} disabled={busy} onClick={() => setSelected(null)}>Cancel</button>
      </div>
    </form>}
    {rows.map(row => <article key={row.kind + row.id} className="space-y-2 rounded border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{row.reference} · {row.kind === 'FIR' ? 'FIR' : 'Complaint'}</h2>
        {row.canRequest && <button className={button} disabled={busy} onClick={() => open({ row })}>Request transfer</button>}
      </div>
      {row.unit && <p className="text-sm">Current custody: {row.unit.name}, {row.unit.district}</p>}
      {row.transfers.map(transfer => <div key={transfer.id} className="space-y-1 border-t pt-2 text-sm">
        <p>{transfer.from.name} → {transfer.to.name} · <strong>{transfer.status}</strong></p>
        <p>{transfer.reason}</p>
        <p>Requested {new Date(transfer.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        {transfer.decisionNote && <p>Decision: {transfer.decisionNote}</p>}
        {transfer.canDecide && <button className={button} disabled={busy} onClick={() => open({ row, transferId: transfer.id })}>Review request</button>}
      </div>)}
    </article>)}
    {!rows.length && !message && <p className="text-sm">No records available for transfer.</p>}
  </section>;
}
