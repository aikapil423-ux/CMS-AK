import { preparePrintableClone } from '@/utils/printElement';
import { diaryLandscape } from '@/lib/weeklyDiaryGeometry';
export function weeklyDiaryPrintHtml(canvas:HTMLElement,columns:number) {
  const landscape=diaryLandscape(columns),clone=preparePrintableClone(canvas,true);
  clone.querySelectorAll('.no-print,[data-no-print]').forEach(node=>node.remove());
  clone.style.width=landscape?'297mm':'210mm';clone.style.maxWidth='100%';clone.style.minWidth='0';clone.style.margin='0';clone.style.padding='10mm';clone.style.boxShadow='none';
  clone.style.setProperty('box-decoration-break','clone');clone.style.setProperty('-webkit-box-decoration-break','clone');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Weekly Crime Diary</title><style>
    @page{size:A4 ${landscape?'landscape':'portrait'};margin:0}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    html,body{margin:0;padding:0;background:white;color:black}
    table{width:100%;max-width:100%;table-layout:fixed;border-collapse:collapse}
    tr{break-inside:avoid}td{overflow-wrap:anywhere;min-width:0}
    [data-print-field]{max-width:100%!important;min-width:0!important;height:auto!important;border:none!important;background:transparent!important;box-shadow:none!important}
  </style></head><body>${clone.outerHTML}</body></html>`;
}
