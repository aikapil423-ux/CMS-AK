/**
 * Universal A4 Printing & Offline Document Utility for Haryana Police CMS
 * 
 * Ensures that:
 * 1. Pop-up blockers never block printing (uses isolated iframe instead of window.open)
 * 2. Ancestor modal styles (fixed overlays, backdrop-blur, overflow-y-auto) never clip pages
 * 3. Exact preview styles (fonts, Hindi text, tables, margins) are preserved
 * 4. Multi-page documents break naturally across A4 pages without blank screens
 */

function preparePrintableClone(el: HTMLElement): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement;

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

    if (orig instanceof HTMLTextAreaElement) {
      dest.textContent = orig.value;
      (dest as HTMLTextAreaElement).value = orig.value;
      dest.style.height = "auto";
      dest.style.overflow = "visible";
    } else if (orig instanceof HTMLInputElement) {
      if (orig.type === "checkbox" || orig.type === "radio") {
        if (orig.checked) {
          dest.setAttribute("checked", "checked");
          (dest as HTMLInputElement).checked = true;
        } else {
          dest.removeAttribute("checked");
          (dest as HTMLInputElement).checked = false;
        }
      } else {
        dest.setAttribute("value", orig.value);
        (dest as HTMLInputElement).value = orig.value;
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
        textarea, input {
          border-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
          color: #000000 !important;
          resize: none !important;
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

