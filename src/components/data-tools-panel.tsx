"use client";

import { useState } from "react";

type ImportResult = {
  message?: string;
  error?: string;
  summary?: Array<{ sheet: string; rows: number }>;
  preview?: Record<string, number>;
  duplicateEmails?: string[];
  saved?: {
    imported: number;
    updated: number;
    totalProfiles: number;
  };
  sampleMembers?: Array<{
    fullName: string;
    email: string;
    phone: string;
    branch: string;
  }>;
};

export function DataToolsPanel() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isMembersUploading, setIsMembersUploading] = useState(false);
  const [membersResult, setMembersResult] = useState<ImportResult | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsUploading(true);
    setResult(null);

    const response = await fetch("/api/admin/import", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as ImportResult;
    setResult(payload);
    setIsUploading(false);
  }

  async function handleMembersSubmit(formData: FormData) {
    setIsMembersUploading(true);
    setMembersResult(null);

    const response = await fetch("/api/admin/members/import", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as ImportResult;
    setMembersResult(payload);
    setIsMembersUploading(false);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Bulk member import
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            Excel thi multiple members add karo
          </h2>
          <p className="mt-3 text-slate-700">
            Member-specific template download karo ane ek sathe ghana members upload karo.
            Required columns: `full_name`, `email`, `phone`.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/admin/members/export"
              className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white"
            >
              Export members Excel
            </a>
            <a
              href="/api/admin/members/template"
              className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-900"
            >
              Download members template
            </a>
          </div>
          <form
            className="mt-6 space-y-4"
            action={async (formData) => {
              await handleMembersSubmit(formData);
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Members Excel file
              </span>
              <input
                className="block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
                type="file"
                name="file"
                accept=".xlsx"
                required
              />
            </label>
            <button
              className="rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isMembersUploading}
            >
              {isMembersUploading ? "Checking members file..." : "Import members"}
            </button>
          </form>

          {membersResult ? (
            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
              {membersResult.error ? (
                <p className="font-medium text-rose-700">{membersResult.error}</p>
              ) : null}
              {membersResult.message ? (
                <p className="font-medium text-emerald-700">{membersResult.message}</p>
              ) : null}
              {membersResult.summary ? (
                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  {membersResult.summary.map((entry) => (
                    <div
                      key={entry.sheet}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                    >
                      <span>{entry.sheet}</span>
                      <span className="font-semibold">{entry.rows} rows</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {membersResult.saved ? (
                <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Imported {membersResult.saved.imported} new, updated{" "}
                  {membersResult.saved.updated}, total profiles {membersResult.saved.totalProfiles}.
                </div>
              ) : null}
              {membersResult.duplicateEmails && membersResult.duplicateEmails.length > 0 ? (
                <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Duplicate emails: {membersResult.duplicateEmails.join(", ")}
                </div>
              ) : null}
              {membersResult.sampleMembers ? (
                <div className="mt-4 grid gap-2">
                  {membersResult.sampleMembers.map((member) => (
                    <div
                      key={`${member.email}-${member.phone}`}
                      className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      <p className="font-semibold text-slate-950">{member.fullName}</p>
                      <p>{member.email}</p>
                      <p>{member.phone}</p>
                      <p>{member.branch}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Excel export
        </p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">
          Download current gym data
        </h2>
        <p className="mt-3 text-slate-700">
          Export the current workbook structure with separate sheets for members,
          plans, exercises, logs, sessions, and attendance.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/api/admin/export"
            className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Export live workbook
          </a>
          <a
            href="/api/admin/template"
            className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-900"
          >
            Download template
          </a>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Excel import
        </p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">
          Validate uploaded workbook
        </h2>
        <p className="mt-3 text-slate-700">
          Upload a `.xlsx` file using the exported template format. The MVP checks
          required sheet names and returns a row summary so staff can verify the file.
        </p>
        <form
          className="mt-6 space-y-4"
          action={async (formData) => {
            await handleSubmit(formData);
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Excel file
            </span>
            <input
              className="block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
              type="file"
              name="file"
              accept=".xlsx"
              required
            />
          </label>
          <button
            className="rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isUploading}
          >
            {isUploading ? "Checking workbook..." : "Import workbook"}
          </button>
        </form>

        {result ? (
          <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
            {"error" in result && result.error ? (
              <p className="font-medium text-rose-700">{result.error}</p>
            ) : null}
            {result.message ? (
              <p className="font-medium text-emerald-700">{result.message}</p>
            ) : null}
            {result.summary ? (
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                {result.summary.map((entry) => (
                  <div
                    key={entry.sheet}
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                  >
                    <span>{entry.sheet}</span>
                    <span className="font-semibold">{entry.rows} rows</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      </div>
    </div>
  );
}
