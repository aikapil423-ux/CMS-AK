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
        body, body * {
          visibility: visible !important;
        }
        .print-container, .print-container * {
          visibility: visible !important;
        }
        .no-print, button, input[type="button"], [data-no-print] {
          display: none !important;
          visibility: hidden !important;
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
        /* Strip screen-only decorative badges/shadows inside print */
        .shadow-md, .shadow-lg, .shadow-2xl, .shadow-sm, .shadow-2xs {
          box-shadow: none !important;
        }
        .rounded-2xl, .rounded-xl {
          border-radius: 0 !important;
        }
        .border-slate-900, .border-slate-800, .border-slate-700 {
          border-color: #000000 !important;
        }
        .bg-slate-50, .bg-blue-50, .bg-amber-50, .bg-purple-50 {
          background-color: transparent !important;
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
