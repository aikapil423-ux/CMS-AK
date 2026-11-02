"use client";

import { useCallback, useEffect, useRef } from 'react';
import type { CaseAnalysis } from '@/types/caseAnalysis';
import { referenceGraphData } from '@/lib/referenceGraphAdapter';

export function FIRKnowledgeGraph({ analysis, onSource }: { analysis: CaseAnalysis; onSource: (id: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = useCallback(() => {
    // The sandbox has an opaque origin. Address only this frame; it cannot access CMS storage/session.
    frame.current?.contentWindow?.postMessage({ type: 'CMS_GRAPH_DATA', graph: referenceGraphData(analysis) }, '*');
  }, [analysis]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'CMS_GRAPH_READY') send();
      if (event.data?.type === 'CMS_GRAPH_SOURCE' && analysis.sources.some(s => s.id === event.data.id)) onSource(event.data.id);
    };
    window.addEventListener('message', receive);
    send();
    return () => window.removeEventListener('message', receive);
  }, [analysis, onSource, send]);
  return <iframe ref={frame} src="/investigation-graph/index.html" title="FIR Knowledge Graph — 2D, 3D and Network views" onLoad={send}
    sandbox="allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox" allow="fullscreen" allowFullScreen
    className="h-[820px] min-h-[650px] w-full rounded-xl border border-slate-200 bg-white" />;
}
