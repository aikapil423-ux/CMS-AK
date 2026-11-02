"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Search, Network, FileText } from 'lucide-react';
import { FIRKnowledgeGraph } from '@/components/fir/FIRKnowledgeGraph';
import type { CaseAnalysis, CaseSource } from '@/types/caseAnalysis';

export function FIRCaseAnalysisPanel({ firId, mode }: { firId: string; mode: 'graph' | 'contradictions' }) {
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState<CaseSource | null>(null);
  const [quote, setQuote] = useState('');
  const inFlight = useRef(false);
  const queued = useRef(false);
  const mounted = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (inFlight.current) { queued.current = true; return; }
    inFlight.current = true;
    if (mounted.current) { setBusy(true); setError(''); }
    try {
      const planResponse = await fetch('/api/fir/entities/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firId }) });
      const plan = await planResponse.json();
      if (!planResponse.ok) throw new Error(plan.error || 'Could not load entity processing plan.');
      const jobs: { id: string; name: string }[] = plan.jobs || [];
      const failures: string[] = [];
      for (let i = 0; i < jobs.length && mounted.current; i++) {
        setProcessingMessage(`Extracting entities ${i + 1}/${jobs.length}: ${jobs[i].name}`);
        try {
          const response = await fetch('/api/fir/entities/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firId, sourceId: jobs[i].id }) });
          const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Extraction failed.');
        } catch (error) { failures.push(`${jobs[i].name}: ${error instanceof Error ? error.message : 'Extraction failed.'}`); }
      }
      if (mounted.current) { setProcessingMessage(''); if (failures.length) setError(failures.join(' • ')); }
      do {
        queued.current = false;
        const res = await fetch('/api/fir/case-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firId, force }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Analysis failed.');
        if (mounted.current) setAnalysis(data.analysis);
        if (data.analysis.aiStatus === 'PARTIAL') queued.current = true;
        force = false;
      } while (queued.current && mounted.current);
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Analysis failed.'); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }, [firId]);

  useEffect(() => {
    mounted.current = true;
    const start = setTimeout(() => { void refresh(); }, 0);
    const changed = () => { void refresh(); };
    window.addEventListener('cms-evidence-updated', changed);
    return () => { mounted.current = false; clearTimeout(start); window.removeEventListener('cms-evidence-updated', changed); };
  }, [firId, refresh]);

  const sources = new Map(analysis?.sources.map(s => [s.id, s]) || []);
  const showSource = useCallback((id: string, value = '') => { setSelectedSource(analysis?.sources.find(s => s.id === id) || null); setQuote(value); }, [analysis]);
  const conflicts = analysis?.conflicts.filter(c => (severity === 'ALL' || c.severity === severity) &&
    `${c.title} ${c.explanation} ${c.oldValue} ${c.newValue}`.toLowerCase().includes(query.toLowerCase())) || [];

  return <section className="space-y-4" aria-label={mode === 'graph' ? 'Knowledge Graph' : 'Case contradictions'}>
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
      <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">{mode === 'graph' ? <Network size={22} /> : <AlertTriangle size={22} />}{mode === 'graph' ? 'Knowledge Graph' : 'Case contradictions'}</h2>
        <p className="mt-1 text-sm text-slate-600">{mode === 'graph' ? 'Saved case facts, people and evidence sources. Select a node to inspect its connections.' : 'पुराने processed data और नए evidence में अंतर — source देखकर verify करें।'}</p>
        {analysis && <p className="mt-2 text-xs text-slate-500">{analysis.sources.length} sources / revisions • Saved {new Date(analysis.analyzedAt).toLocaleString()} • {analysis.aiStatus === 'COMPLETED' ? 'AI comparison completed' : 'AI comparison incomplete'}</p>}
        {analysis?.aiProgress && <p className="mt-1 text-xs font-semibold text-blue-700">AI batches: {analysis.aiProgress.completed} / {analysis.aiProgress.total}</p>}
      </div>
      <button onClick={() => void refresh(true)} disabled={busy} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw size={16} className={busy ? 'animate-spin' : ''} />{busy ? 'Comparing & saving…' : 'Analyze / Refresh'}</button>
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {processingMessage && <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{processingMessage}</p>}
    {analysis?.aiMessage && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{analysis.aiMessage}</p>}
    {!!analysis?.pendingEvidence && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{analysis.pendingEvidence} evidence record(s) pending or failed processing. Comparison does not cover these files yet.</p>}
    {mode === 'contradictions' && <>
      <div className="rounded-[14px] border border-slate-200 bg-linear-to-br from-amber-50/70 via-white to-white px-4 py-3.5">
        <div className="mb-2.5 flex flex-wrap items-center gap-2"><span className="text-[13px] font-bold text-slate-800">📁 FIR case analysis</span><span className="ml-auto rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">{analysis?.conflicts.length || 0} flags</span></div>
        <div className="flex flex-wrap gap-2">{(['HIGH', 'MEDIUM', 'LOW'] as const).map(s => <button key={s} onClick={() => setSeverity(severity === s ? 'ALL' : s)} aria-pressed={severity === s} className={`rounded-full border px-3 py-1 text-[11px] ${severity === s ? 'border-blue-300 bg-blue-50 text-blue-800 ring-1 ring-blue-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><span>{s}</span> <strong className="ml-1 text-slate-900">{analysis?.conflicts.filter(c => c.severity === s).length || 0}</strong></button>)}</div>
      </div>
      <p className="text-xs text-slate-500">Potential conflicts require officer review. Different values can reflect a correction or different context; they do not establish a false statement.</p>
    </>}
    {mode === 'contradictions' && <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><Search size={16} className="text-slate-400" /><input aria-label="Search case analysis" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conflicting facts or statements…" className="w-full bg-transparent text-sm outline-none" /></label>}
    {mode === 'graph' && !analysis && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{busy ? 'Loading processed graph data…' : 'No saved graph data yet. Use Analyze / Refresh.'}</p>}
    {mode === 'contradictions' && <div className="space-y-3">{conflicts.map(c => <article key={c.id} className={`overflow-hidden rounded-lg border border-l-[3px] bg-slate-50 px-3.5 py-3 ${c.severity === 'HIGH' ? 'border-slate-200 border-l-red-500' : c.severity === 'MEDIUM' ? 'border-slate-200 border-l-amber-500' : 'border-slate-200 border-l-emerald-500'}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.severity === 'HIGH' ? 'bg-red-100 text-red-700' : c.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{c.severity}</span><h3 className="text-[13px] font-semibold text-slate-700">{c.title}</h3><span className="ml-auto text-[11px] text-slate-500">{c.method === 'AI' ? 'AI • source checked' : 'Saved field difference'}</span></div>
      <div className="space-y-2"><div className="text-[13px]"><p className="mb-1 text-[10px] font-bold text-slate-500">PREVIOUS / पहले का data</p><mark className="whitespace-pre-wrap break-words bg-red-200 px-1 font-medium text-red-950">{c.oldValue}</mark></div><p className="text-[11px] font-bold text-red-600">vs</p><div className="text-[13px]"><p className="mb-1 text-[10px] font-bold text-slate-500">NEW / नया data</p><mark className="whitespace-pre-wrap break-words bg-yellow-200 px-1 font-medium text-amber-950">{c.newValue}</mark></div></div>
      <p className="my-3 rounded-md border border-amber-100 bg-white px-2.5 py-2 text-xs text-slate-700">{c.explanation}</p>
      <div className="border-t border-dashed border-slate-200 pt-2"><p className="mb-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase">📎 Related documents</p><div className="grid gap-2 sm:grid-cols-2">{[{ id: c.oldSourceId, value: c.oldValue }, { id: c.newSourceId, value: c.newValue }].map(side => <button key={side.id} onClick={() => showSource(side.id, side.value)} className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left text-xs text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><span className="flex items-center gap-1"><FileText size={14} />{sources.get(side.id)?.name || 'View source'}</span><span className="mt-1 block text-[10px] text-slate-500">{sources.get(side.id)?.kind} • {sources.get(side.id)?.date}</span></button>)}</div></div>
    </article>)}{!conflicts.length && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">{busy ? 'Comparing saved sources with new data…' : !analysis ? 'No saved analysis yet.' : query || severity !== 'ALL' ? 'No flags match these filters.' : analysis.aiStatus !== 'COMPLETED' || analysis.pendingEvidence ? 'No field differences found. Full comparison is incomplete; see status above.' : analysis.sources.length < 2 ? 'Add processed evidence or another source to compare.' : 'No supported contradictions detected in the analyzed sources.'}</div>}</div>}
    {mode === 'graph' && analysis && <FIRKnowledgeGraph analysis={analysis} onSource={showSource} />}
    {selectedSource && <div className="rounded-xl border border-blue-200 bg-white p-5"><div className="flex justify-between gap-3"><h3 className="font-bold">Source: {selectedSource.name}</h3><button className="text-sm text-blue-700" onClick={() => setSelectedSource(null)}>Close</button></div><p className="my-2 text-xs text-slate-500">{selectedSource.kind} • {selectedSource.date}</p>{selectedSource.documentUrl && <a href={selectedSource.documentUrl} target="_blank" rel="noopener noreferrer" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 underline"><FileText size={14} />Open original document</a>}<div className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{quote && selectedSource.text.includes(quote) ? <>{selectedSource.text.slice(0, selectedSource.text.indexOf(quote))}<mark className="bg-yellow-200 text-slate-950">{quote}</mark>{selectedSource.text.slice(selectedSource.text.indexOf(quote) + quote.length)}</> : selectedSource.text}</div></div>}
  </section>;
}
