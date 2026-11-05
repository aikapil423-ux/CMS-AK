/**
 * Universal A4 Printing & Offline Document Utility for Haryana Police CMS
 * 
 * Ensures that:
 * 1. Pop-up blockers never block printing (uses isolated iframe instead of window.open)
 * 2. Ancestor modal styles (fixed overlays, backdrop-blur, overflow-y-auto) never clip pages
 * 3. Exact preview styles (fonts, Hindi text, tables, margins) are preserved
 * 4. Multi-page documents break naturally across A4 pages without blank screens
 */

export function preparePrintableClone(el: HTMLElement, freezeLayout = false): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement;
  if (freezeLayout) {
    // Snapshot the actual template appearance so screen/print media queries and
    // missing Tailwind layers in the isolated preview cannot change formatting.
    const properties = ['display', 'box-sizing', 'font-family', 'font-size', 'font-weight',
      'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-transform',
      'text-decoration', 'color', 'white-space', 'word-break', 'overflow-wrap',
      'grid-template-columns', 'grid-column', 'gap', 'flex-direction', 'flex-grow',
      'flex-shrink', 'align-items', 'align-self', 'justify-content',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'border-top', 'border-right', 'border-bottom', 'border-left'];
    const originals = el.querySelectorAll<HTMLElement>('*');
    const copies = clone.querySelectorAll<HTMLElement>('*');
    originals.forEach((source, index) => {
      const computed = window.getComputedStyle(source);
      const copy = copies[index];
      for (const property of properties) copy.style.setProperty(property, computed.getPropertyValue(property));
      if (source.classList.contains('w-full')) copy.style.width = '100%';
      else if (/\bw-\d+\b/.test(source.className)) copy.style.width = computed.width;
      if (/\bh-\d+\b/.test(source.className)) copy.style.height = computed.height;
    });
  }

  const origInputs = el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );
  const cloneInputs = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );

  for (let i = 0; i < origInputs.length; i++) {
    const orig = origInputs[i];
    const dest = cloneInputs[i];
    if (!dest) continue;
    if (orig.hasAttribute('data-no-print')) { dest.remove(); continue; }

    if (orig instanceof HTMLTextAreaElement) {
      // Replace textarea with auto-wrapping pre-wrap text element in print clone so EVERY typed character and line-break renders completely in Print Preview
      const printBlock = document.createElement("div");
      printBlock.setAttribute("data-print-field", "");
      printBlock.className = (dest.className || "")
        .replace(/\bbg-[^\s]+/g, "bg-transparent")
        .replace(/\bborder-[^\s]+/g, "border-transparent")
        .replace(/\bborder\b/g, "")
        .replace(/\brounded[^\s]*/g, "")
        .replace(/\bshadow[^\s]*/g, "")
        .trim();
      printBlock.textContent = orig.value || "";
      printBlock.style.cssText = dest.style.cssText;
      printBlock.style.whiteSpace = "pre-wrap";
      printBlock.style.wordBreak = "break-word";
      printBlock.style.overflow = "visible";
      printBlock.style.height = "auto";
      printBlock.style.minHeight = freezeLayout ? (dest.style.minHeight || window.getComputedStyle(orig).minHeight) : "auto";
      printBlock.style.display = "block";
      printBlock.style.border = "none";
      printBlock.style.background = "transparent";
      printBlock.style.boxShadow = "none";
      dest.parentNode?.replaceChild(printBlock, dest);
    } else if (orig instanceof HTMLInputElement) {
      if (orig.type === "checkbox" || orig.type === "radio") {
        if (orig.checked) {
          dest.setAttribute("checked", "checked");
          (dest as HTMLInputElement).checked = true;
        } else {
          dest.removeAttribute("checked");
          (dest as HTMLInputElement).checked = false;
        }
      } else if (orig.type === "button" || orig.type === "submit" || orig.type === "reset") {
        // buttons
      } else {
        const printBlock = document.createElement("div");
        printBlock.setAttribute("data-print-field", "");
        printBlock.className = (dest.className || "")
        .replace(/\bbg-[^\s]+/g, "bg-transparent")
        .replace(/\bborder-[^\s]+/g, "border-transparent")
        .replace(/\bborder\b/g, "")
        .replace(/\brounded[^\s]*/g, "")
        .replace(/\bshadow[^\s]*/g, "")
        .trim();
        printBlock.textContent = orig.value || "";
        printBlock.style.cssText = dest.style.cssText;
        printBlock.style.whiteSpace = "pre-wrap";
        printBlock.style.wordBreak = "break-word";
        printBlock.style.overflow = "visible";
        printBlock.style.height = "auto";
        printBlock.style.minHeight = freezeLayout ? (dest.style.minHeight || window.getComputedStyle(orig).minHeight) : "auto";
        printBlock.style.display = "block";
        printBlock.style.border = "none";
        printBlock.style.outline = "none";
        printBlock.style.background = "transparent";
        printBlock.style.boxShadow = "none";
        dest.parentNode?.replaceChild(printBlock, dest);
      }
    } else if (orig instanceof HTMLSelectElement) {
      dest.setAttribute("value", orig.value);
      const selectedIndex = orig.selectedIndex;
      const destOptions = (dest as HTMLSelectElement).options;
      for (let j = 0; j < destOptions.length; j++) {
        if (j === selectedIndex) {
          destOptions[j].setAttribute("selected", "selected");
        } else {
          destOptions[j].removeAttribute("selected");
        }
      }
    }
  }

  if (el.id) {
    clone.id = el.id;
  }
  return clone;
}

export function printA4Element(
  elementOrId: HTMLElement | string,
  documentTitle?: string
): void {
  if (typeof window === "undefined") return;

  const el =
    typeof elementOrId === "string"
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!el) {
    console.warn("Print target element not found:", elementOrId);
    window.print();
    return;
  }

  // Create or reuse hidden iframe
  let iframe = document.getElementById("cms-print-iframe") as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "cms-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Collect all stylesheets, filtering out obsolete global print hacks that hide body *
  let stylesHtml = "";
  document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    if (node.tagName.toLowerCase() === "style") {
      const text = node.textContent || "";
      if (text.includes("visibility: hidden") || text.includes("visibility:hidden")) {
        return;
      }
    }
    stylesHtml += node.outerHTML;
  });

  const title = documentTitle || "Police Legal Document";
  const cloned = preparePrintableClone(el);

  if (el.id === "zimni-printable-canvas") {
    iframeDoc.open();
    iframeDoc.write(getZimniPagedHtml(el));
    iframeDoc.close();
    const ready = iframeDoc.fonts?.ready || Promise.resolve();
    void ready.then(() => setTimeout(() => iframe?.contentWindow?.print(), 350));
    return;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="hi">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      ${stylesHtml}
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        * {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          font-size: 10.5pt;
          line-height: 1.5;
          text-rendering: optimizeLegibility;
        }
        body, body * {
          visibility: visible !important;
        }
        .print-container {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }
        #printable-receipt {
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          box-shadow: none !important;
          border: 1.5px solid #94a3b8 !important;
          padding: 22px 26px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .no-print, button, input[type="button"], [data-no-print] {
          display: none !important;
          visibility: hidden !important;
        }
        /* Preserve flex and grid in print */
        .flex { display: flex !important; }
        .flex-row { flex-direction: row !important; }
        .flex-col { flex-direction: column !important; }
        .items-center { align-items: center !important; }
        .items-start { align-items: flex-start !important; }
        .items-end { align-items: flex-end !important; }
        .justify-between { justify-content: space-between !important; }
        .justify-center { justify-content: center !important; }
        .grid { display: grid !important; }
        .grid-cols-2 { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .gap-1 { gap: 0.25rem !important; }
        .gap-1\.5 { gap: 0.375rem !important; }
        .gap-2 { gap: 0.5rem !important; }
        .gap-3 { gap: 0.75rem !important; }
        .space-y-0\.5 > * + * { margin-top: 0.125rem !important; }
        .space-y-1\.5 > * + * { margin-top: 0.375rem !important; }
        .space-y-2 > * + * { margin-top: 0.5rem !important; }
        .space-y-4 > * + * { margin-top: 1rem !important; }
        .space-y-5 > * + * { margin-top: 1.25rem !important; }
        
        /* Icons */
        svg { display: inline-block !important; vertical-align: middle !important; }
        svg.w-7 { width: 28px !important; height: 28px !important; }
        svg.w-3\.5 { width: 14px !important; height: 14px !important; }
        svg.w-4 { width: 16px !important; height: 16px !important; }

        /* Borders and backgrounds */
        .border { border: 1px solid #94a3b8 !important; }
        .border-t { border-top: 1px solid #cbd5e1 !important; }
        .border-b { border-bottom: 1px solid #cbd5e1 !important; }
        .border-b-2 { border-bottom: 2px solid #0f172a !important; }
        .border-t-2 { border-top: 2px solid #0f172a !important; }
        .border-slate-300 { border-color: #cbd5e1 !important; }
        .border-slate-400 { border-color: #94a3b8 !important; }
        .border-slate-900 { border-color: #0f172a !important; }
        .border-dashed { border-style: dashed !important; }
        
        .bg-white { background-color: #ffffff !important; }
        .bg-slate-50 { background-color: #f8fafc !important; }
        .bg-slate-100 { background-color: #f1f5f9 !important; }

        /* Typography */
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
        .font-bold { font-weight: 700 !important; }
        .font-semibold { font-weight: 600 !important; }
        .uppercase { text-transform: uppercase !important; }
        .text-slate-950 { color: #020617 !important; }
        .text-slate-900 { color: #0f172a !important; }
        .text-slate-800 { color: #1e293b !important; }
        .text-slate-700 { color: #334155 !important; }
        .text-slate-600 { color: #475569 !important; }
        .text-slate-500 { color: #64748b !important; }
        .text-\[\#0b192c\] { color: #0b192c !important; }

        table {
          border-collapse: collapse !important;
          width: 100% !important;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th, td {
          border-color: #000000 !important;
        }
        /* Strip heavy screen shadows */
        .shadow-md, .shadow-lg, .shadow-2xl, .shadow-sm, .shadow-2xs {
          box-shadow: none !important;
        }
        /* Form inputs and textareas in print */
        textarea, input, select {
          border: none !important;
          border-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
          color: #000000 !important;
          resize: none !important;
          outline: none !important;
        }
        /* Remove editor field chrome, preserving the Zimni layout's selected borders. */
        #zimni-printable-canvas input,
        #zimni-printable-canvas textarea,
        #zimni-printable-canvas [data-print-field],
        #fir-printable-notice input,
        #fir-printable-notice textarea {
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }
        /* Strip input box borders in print */
        #fir-printable-notice div.bg-slate-50,
        #fir-printable-notice div.border-slate-200,
        #fir-printable-notice div.border {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        /* Fix Table width and cell wrap so nothing overflows */
        table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        th, td {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          white-space: normal !important;
        }
        input::placeholder, textarea::placeholder {
          color: transparent !important;
          opacity: 0 !important;
          -webkit-text-fill-color: transparent !important;
        }
        [contenteditable] {
          border-color: transparent !important;
          outline: none !important;
        }
      </style>
    </head>
    <body>
      <div class="print-container" style="width: 100%; max-width: 100%; margin: 0 auto;">
        ${cloned.outerHTML}
      </div>
    </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch (e) {
      console.warn("Iframe print failed, falling back to window.print()", e);
      window.print();
    }
  }, 350);
}

/** Build the same measured A4 sheets for the Zimni preview and printer. */
export function getZimniPagedHtml(el: HTMLElement): string {
  const clone = preparePrintableClone(el, true);
  clone.querySelectorAll('.no-print, button, [data-no-print], [aria-hidden="true"]').forEach(node => node.remove());
  // Keep the print layout independent of Tailwind's responsive/layered rules.
  // These same inline dimensions are used when measuring page overflow below.
  clone.querySelectorAll<HTMLElement>('.grid-cols-12').forEach(row => {
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'repeat(12, minmax(0, 1fr))';
    for (const cell of Array.from(row.children) as HTMLElement[]) {
      const span = cell.classList.contains('col-span-9') ? 9 : cell.classList.contains('col-span-2') ? 2 : 1;
      cell.style.gridColumn = `span ${span} / span ${span}`;
      cell.style.minWidth = '0';
      cell.style.boxSizing = 'border-box';
    }
  });
  clone.querySelectorAll<HTMLElement>('[data-print-field]').forEach(field => {
    field.style.width = '100%';
    field.style.maxWidth = '100%';
    field.style.minWidth = '0';
    field.style.boxSizing = 'border-box';
    field.style.wordBreak = 'normal';
    field.style.overflowWrap = 'break-word';
  });
  clone.removeAttribute('id');
  clone.className = 'zimni-page-content';
  clone.removeAttribute('style');
  const table = clone.querySelector<HTMLElement>('[data-zimni-table]');
  const measure = document.createElement('div');
  measure.style.cssText = 'position:absolute;left:-100000px;top:0;width:190mm;visibility:hidden;pointer-events:none';
  const fontSize = el.classList.contains('text-xs') ? '12px' : el.classList.contains('text-base') ? '16px' : '14px';
  measure.style.fontFamily = 'Georgia, "Times New Roman", serif';
  measure.style.fontSize = fontSize;
  measure.style.lineHeight = '1.6';
  document.body.appendChild(measure);
  const ruler = document.createElement('div');
  ruler.style.height = '281mm';
  measure.appendChild(ruler);
  const available = ruler.getBoundingClientRect().height;
  ruler.remove();
  const pages: HTMLElement[] = [];
  let page: HTMLElement;
  let pageTable: HTMLElement | null = null;
  function nextPage() {
    page = document.createElement('div');
    page.className = 'zimni-page-content';
    measure.appendChild(page);
    pages.push(page);
    pageTable = null;
  }
  function appendBlock(block: HTMLElement, inTable: boolean) {
    const target = () => {
      if (!inTable || !table) return page;
      if (!pageTable) {
        pageTable = table.cloneNode(false) as HTMLElement;
        page.appendChild(pageTable);
      }
      return pageTable;
    };
    const hadContent = Boolean(page.textContent?.trim());
    target().appendChild(block);
    if (available > 0 && page.getBoundingClientRect().height > available + 1 && hadContent) {
      block.remove();
      if (pageTable && !pageTable.children.length) pageTable.remove();
      nextPage();
      target().appendChild(block);
    }
  }
  try {
    nextPage();
    for (const child of Array.from(clone.children)) {
      if (child === table) {
        for (const row of Array.from(child.children)) appendBlock(row as HTMLElement, true);
      } else appendBlock(child as HTMLElement, false);
    }
    return `<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><style>
      @page { size:A4 portrait; margin:8mm 10mm; }
      * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      html,body { margin:0; padding:0; background:#e2e8f0; }
      .zimni-sheet { width:210mm; min-height:297mm; padding:8mm 10mm; margin:16px auto; background:white; box-shadow:0 1px 6px #94a3b8; }
      .zimni-page-content { width:190mm; font:${fontSize}/1.6 Georgia,"Times New Roman",serif; color:#0f172a; }
      .zimni-page-content .grid-cols-12 { display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); }
      .zimni-page-content [data-print-field] { border:none!important; background:transparent!important; box-shadow:none!important; }
      .zimni-page-content [data-zimni-table] { box-decoration-break:clone; -webkit-box-decoration-break:clone; }
      .zimni-page-content [data-zimni-table] > * { break-inside:avoid; }
      .zimni-page-content .no-print, .zimni-page-content button { display:none!important; }
      @media print {
        html,body { background:white!important; }
        .zimni-sheet { width:190mm; min-height:0; padding:0; margin:0; box-shadow:none; break-after:page; }
        .zimni-sheet:last-child { break-after:auto; }
        .zimni-page-content { width:190mm!important; }
      }
    </style></head><body>${pages.map(p => `<section class="zimni-sheet">${p.outerHTML}</section>`).join('')}</body></html>`;
  } finally { measure.remove(); }
}

/**
 * Universal print function for raw HTML content (e.g. Generated Reports, Notices, Zimni).
 * Uses the isolated iframe to prevent pop-up blocker issues.
 */
export function printHtmlContent(
  htmlContent: string,
  documentTitle?: string
): void {
  if (typeof window === "undefined") return;

  let iframe = document.getElementById("cms-print-iframe") as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "cms-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  let stylesHtml = "";
  document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  const title = documentTitle || "Police Legal Document";

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="hi">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      ${stylesHtml}
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
        }
        .no-print, button, input[type="button"], [data-no-print] {
          display: none !important;
        }
        table {
          border-collapse: collapse !important;
          width: 100% !important;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th, td {
          border-color: #000000 !important;
        }
      </style>
    </head>
    <body>
      <div class="print-container" style="width: 100%; max-width: 100%; margin: 0 auto;">
        ${htmlContent}
      </div>
    </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch (e) {
      console.warn("Iframe print failed", e);
    }
  }, 350);
}

/**
 * Downloads the given element as an offline-printable, self-contained HTML file.
 */
export function downloadA4DocumentAsHtml(
  elementOrId: HTMLElement | string,
  filename: string,
  documentTitle?: string
): void {
  if (typeof window === "undefined") return;

  const el =
    typeof elementOrId === "string"
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!el) {
    console.warn("Download target element not found:", elementOrId);
    return;
  }

  // Collect all stylesheets from current document, filtering out rogue print hacks
  let stylesHtml = "";
  document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    if (node.tagName.toLowerCase() === "style") {
      const text = node.textContent || "";
      if (text.includes("visibility: hidden") || text.includes("visibility:hidden")) {
        return;
      }
    }
    stylesHtml += node.outerHTML;
  });

  const title = documentTitle || "Police Legal Document";
  const cloned = preparePrintableClone(el);
  const contentHtml = cloned.outerHTML;

  const fullHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${stylesHtml}
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #f8fafc;
      color: #000000;
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }
    .a4-wrapper {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 18mm 16mm;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    @media print {
      body {
        padding: 0 !important;
        background: #ffffff !important;
      }
      .a4-wrapper {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        min-height: auto !important;
      }
      .no-print, [data-no-print] {
        display: none !important;
      }
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
    }
    th, td {
      border-color: #000000 !important;
    }
  </style>
</head>
<body>
  <div class="a4-wrapper">
    ${contentHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Returns the standalone, fully styled HTML string of the given element.
 */
export function getA4DocumentHtml(
  elementOrId: HTMLElement | string,
  documentTitle?: string
): string {
  if (typeof window === "undefined") return "";

  const el =
    typeof elementOrId === "string"
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!el) {
    console.warn("Target element not found:", elementOrId);
    return "";
  }

  let stylesHtml = "";
  document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    if (node.tagName.toLowerCase() === "style") {
      const text = node.textContent || "";
      if (text.includes("visibility: hidden") || text.includes("visibility:hidden")) {
        return;
      }
    }
    stylesHtml += node.outerHTML;
  });

  const title = documentTitle || "Police Legal Document";
  const cloned = preparePrintableClone(el);
  const contentHtml = cloned.outerHTML;

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${stylesHtml}
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #f8fafc;
      color: #000000;
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }
    .a4-wrapper {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 18mm 16mm;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    @media print {
      body {
        padding: 0 !important;
        background: #ffffff !important;
      }
      .a4-wrapper {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        min-height: auto !important;
      }
      .no-print, [data-no-print] {
        display: none !important;
      }
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
    }
    th, td {
      border-color: #000000 !important;
    }
  </style>
</head>
<body>
  <div class="a4-wrapper">
    ${contentHtml}
  </div>
</body>
</html>`;
}

