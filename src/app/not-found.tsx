import Link from "next/link";
import { ShieldAlert, Home, BookOpen, FileText, Scale } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-white dark:bg-[#101e38] border border-slate-200 dark:border-[#223456] rounded-xl shadow-sm p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            HTTP 404 • Haryana Police CMS
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Page or Record Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The requested case route or resource does not exist or may have been moved. Please select an active module below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-[#203c88] hover:bg-[#172e70] text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Modules Portal</span>
          </Link>
          <Link
            href="/general-diary"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-[#172747] hover:bg-slate-200 dark:hover:bg-[#233760] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-[#273b63] text-xs sm:text-sm font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Roznamcha GD</span>
          </Link>
          <Link
            href="/complaints"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-[#172747] hover:bg-slate-200 dark:hover:bg-[#233760] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-[#273b63] text-xs sm:text-sm font-semibold transition-colors"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Complaints Register</span>
          </Link>
          <Link
            href="/fir"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-[#172747] hover:bg-slate-200 dark:hover:bg-[#233760] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-[#273b63] text-xs sm:text-sm font-semibold transition-colors"
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>FIR Register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
