"use client";

import { useState } from "react";
import { printHtmlContent } from "@/utils/printElement";

type Cell = string | number;
type TableRow = { key:string; values:Cell[]; sortValues?:Cell[] };
const pageSize = 25;
const collator = new Intl.Collator("en",{numeric:true,sensitivity:"base"});
const escapeHtml = (value:Cell) => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;")
  .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");

export function TelecomResultsTable({title, firLabel, headers, rows}:{
  title:string; firLabel?:string; headers:string[]; rows:TableRow[];
}) {
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState<{column:number; descending:boolean}|null>(null);
  const [page,setPage]=useState(0);
  const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered=rows.filter(row=>{
    const text=row.values.join(" ").toLowerCase();
    return terms.every(term=>text.includes(term));
  });
  if(sort)filtered.sort((a,b)=>{
    const left=a.sortValues?.[sort.column] ?? a.values[sort.column] ?? "";
    const right=b.sortValues?.[sort.column] ?? b.values[sort.column] ?? "";
    const order=typeof left==="number" && typeof right==="number"
      ? left-right : collator.compare(String(left),String(right));
    return sort.descending?-order:order;
  });
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const currentPage=Math.min(page,pageCount-1);

  function print(){
    const cellStyle="border:1px solid #64748b;padding:4px 6px;overflow-wrap:anywhere";
    const heading=headers.map(label=>'<th style="'+cellStyle+'">'+escapeHtml(label)+'</th>').join("");
    const body=filtered.map(row=>"<tr>"+row.values.map(value=>
      '<td style="'+cellStyle+'">'+escapeHtml(value)+'</td>').join("")+"</tr>").join("");
    const context=[firLabel, query.trim() && "Search: "+query.trim(), filtered.length+" rows"].filter(Boolean)
      .map(value=>escapeHtml(value!)).join(" · ");
    printHtmlContent('<h1 style="font-size:16pt">'+escapeHtml(title)+'</h1><p>'+context+
      '</p><table style="font-size:9pt"><thead><tr>'+heading+'</tr></thead><tbody>'+body+'</tbody></table>',escapeHtml(title));
  }

  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <input type="search" aria-label={"Search "+title} placeholder="Search table…" value={query}
        onChange={e=>{setQuery(e.target.value);setPage(0);}} className="min-w-44 rounded border border-slate-300 px-2 py-1.5" />
      <button type="button" onClick={print} disabled={!filtered.length}
        className="rounded bg-blue-900 px-3 py-1.5 font-bold text-white disabled:opacity-50">Print Table</button>
      <span role="status" className="text-slate-600">{filtered.length} of {rows.length} rows</span>
    </div>
    <div className="overflow-x-auto">
      <table aria-label={title} className="w-full text-left text-xs">
        <thead className="border-b bg-slate-100 text-slate-700">
          <tr>{headers.map((header,column)=><th key={header} scope="col" className="px-3 py-2"
            aria-sort={sort?.column===column?(sort.descending?"descending":"ascending"):undefined}>
            <button type="button" className="text-left font-bold"
              onClick={()=>{setSort({column,descending:sort?.column===column?!sort.descending:false});setPage(0);}}>
              {header} <span aria-hidden="true">{sort?.column===column?(sort.descending?"▼":"▲"):"↕"}</span>
            </button>
          </th>)}</tr>
        </thead>
        <tbody>
          {filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize).map(row=><tr key={row.key} className="border-b border-slate-100">
            {row.values.map((value,index)=><td key={index} className="px-3 py-2">{value}</td>)}
          </tr>)}
          {!filtered.length && <tr><td colSpan={headers.length} className="px-3 py-3 text-slate-600">
            {rows.length?"No rows match your search.":"No records available."}
          </td></tr>}
        </tbody>
      </table>
    </div>
    {pageCount>1 && <div className="flex items-center gap-2 text-xs">
      <button type="button" className="border px-2 py-1 disabled:opacity-40" disabled={!currentPage} onClick={()=>setPage(currentPage-1)}>Previous</button>
      <span>Page {currentPage+1} of {pageCount}</span>
      <button type="button" className="border px-2 py-1 disabled:opacity-40" disabled={currentPage+1>=pageCount} onClick={()=>setPage(currentPage+1)}>Next</button>
    </div>}
  </div>;
}
