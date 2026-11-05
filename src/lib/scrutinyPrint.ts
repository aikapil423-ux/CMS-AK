import { preparePrintableClone } from '@/utils/printElement';
export function scrutinyPrintHtml(canvas:HTMLElement) {
  const clone=preparePrintableClone(canvas,true);
  clone.querySelectorAll('[data-no-print],.no-print').forEach(node=>node.remove());
  clone.querySelectorAll<HTMLElement>('[data-scrutiny-page]').forEach(page=>{
    page.style.display='block';page.style.margin='0';page.style.boxShadow='none';
    page.style.breakAfter='page';page.style.width='210mm';page.style.minHeight='297mm';
  });
  const last=clone.querySelector<HTMLElement>('[data-scrutiny-page="12"]');if(last)last.style.breakAfter='auto';
  clone.querySelectorAll<HTMLButtonElement>('button[data-scrutiny-field]').forEach(button=>{
    const mark=document.createElement('span');mark.textContent=button.textContent;mark.style.cssText=button.style.cssText;button.replaceWith(mark);
  });
  clone.querySelectorAll<HTMLElement>('[data-print-field]').forEach(field=>{field.style.border='none';field.style.boxShadow='none';field.style.background='transparent';});
  return `<!doctype html><html lang="hi"><head><meta charset="utf-8"><title>Scrutiny Performa</title><style>
    @page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:white}
    table{border-collapse:collapse;table-layout:fixed}tr{break-inside:avoid}h2,h3{break-after:avoid}
    [data-scrutiny-page]{box-decoration-break:clone;-webkit-box-decoration-break:clone}
    </style></head><body>${clone.outerHTML}</body></html>`;
}
