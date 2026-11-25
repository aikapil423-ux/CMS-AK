import { useLanguage } from "@/context/LanguageContext";
import type { ReactNode } from "react";

export const inputStyle = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700";
export const buttonStyle = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50";
export const primaryStyle = "inline-flex items-center gap-2 rounded-md bg-[#203c88] px-4 py-2 text-sm font-semibold text-white hover:bg-[#182f70] disabled:opacity-50";
const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
export const displayDate = (value: string) => value && Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) : value || "—";
export const message = (error: unknown) => error instanceof Error ? error.message : "Something went wrong.";

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "IIF-VI request failed.");
  return data;
}

export function DataTable({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty: string }) {
  const { t } = useLanguage();
  if (!rows.length) return <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">{t(empty)}</p>;
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#203c88] text-white">
          <tr>{columns.map(column => <th key={column} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">{t(column)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, index) => (
            <tr key={index} className="align-top odd:bg-white even:bg-slate-50">
              {row.map((value, cell) => <td key={cell} className="min-w-fit px-3 py-2">{value || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
