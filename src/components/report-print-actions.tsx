"use client";

export function ReportPrintActions() {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Print / Save as PDF
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
      >
        Close
      </button>
    </div>
  );
}
