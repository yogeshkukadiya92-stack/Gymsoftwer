"use client";

import { useState } from "react";

import { IntakeForm, IntakeFormField, IntakeFormResponse } from "@/lib/forms";
import { Profile } from "@/lib/types";

type ClassAttendanceWorkspaceProps = {
  forms: IntakeForm[];
  responses: IntakeFormResponse[];
  members: Profile[];
};

type FilterState = {
  audience: string;
  date: string;
  search: string;
};

const defaultFilters: FilterState = {
  audience: "All",
  date: new Date().toISOString().slice(0, 10),
  search: "",
};

function getResponseFieldValue(
  form: IntakeForm,
  response: IntakeFormResponse,
  options: { type?: IntakeFormField["type"]; labelPattern?: RegExp },
) {
  const field = form.fields.find((item) => {
    if (options.type && item.type === options.type) {
      return true;
    }

    if (options.labelPattern && options.labelPattern.test(item.label)) {
      return true;
    }

    return false;
  });

  return field ? response.answers[field.id] ?? "" : "";
}

export function ClassAttendanceWorkspace({
  forms,
  responses,
  members,
}: ClassAttendanceWorkspaceProps) {
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? "");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const selectedForm = forms.find((form) => form.id === selectedFormId) ?? forms[0] ?? null;
  const audiences = Array.from(new Set(forms.map((form) => form.audience).filter(Boolean))).sort();

  const filteredForms = forms.filter((form) => {
    const matchesAudience = filters.audience === "All" || form.audience === filters.audience;
    const matchesSearch =
      !filters.search.trim() ||
      form.title.toLowerCase().includes(filters.search.trim().toLowerCase()) ||
      form.description.toLowerCase().includes(filters.search.trim().toLowerCase());

    return matchesAudience && matchesSearch;
  });

  const selectedResponses = responses
    .filter((response) => response.formId === selectedForm?.id)
    .filter((response) => {
      const [datePart = ""] = response.submittedAt.split(" ");
      return !filters.date || datePart === filters.date;
    });

  const attendeeRows = selectedForm
    ? selectedResponses.map((response) => {
        const matchedMember = response.memberId
          ? members.find((member) => member.id === response.memberId)
          : undefined;
        const name =
          matchedMember?.fullName ||
          getResponseFieldValue(selectedForm, response, {
            labelPattern: /full\s*name|name/i,
          }) ||
          "Unknown attendee";
        const phone =
          matchedMember?.phone ||
          response.respondentPhone ||
          getResponseFieldValue(selectedForm, response, { type: "phone" }) ||
          "-";
        const email =
          matchedMember?.email ||
          getResponseFieldValue(selectedForm, response, { type: "email" }) ||
          "-";

        return {
          response,
          matchedMember,
          name,
          phone,
          email,
          submittedAt: response.submittedAt,
          location: response.metadata?.submittedFrom || "-",
          device: response.metadata?.deviceType || "-",
        };
      })
    : [];

  const summary = {
    total: attendeeRows.length,
    matched: attendeeRows.filter((row) => row.matchedMember).length,
    unmatched: attendeeRows.filter((row) => !row.matchedMember).length,
    latest:
      attendeeRows
        .map((row) => row.submittedAt)
        .sort((left, right) => right.localeCompare(left))[0] ?? "-",
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Form-based attendance
        </p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">
          Attendance now comes from submitted forms
        </h2>
        <p className="mt-2 text-slate-600">
          Each attendance form works like a class roster. When someone submits the form,
          they appear here for the selected date.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <select
            value={filters.audience}
            onChange={(event) =>
              setFilters((current) => ({ ...current, audience: event.target.value }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value="All">All audiences</option>
            {audiences.map((audience) => (
              <option key={audience} value={audience}>
                {audience}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date}
            onChange={(event) =>
              setFilters((current) => ({ ...current, date: event.target.value }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
          />
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            className="rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="Search forms"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setFilters(defaultFilters)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Reset filters
          </button>
          <a
            href="/admin/form-responses"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Open form responses
          </a>
          <a
            href="/admin/forms"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Manage attendance forms
          </a>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Form list
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            Attendance sources
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {filteredForms.length} form(s) match the current filters.
          </p>

          <div className="mt-5 space-y-3">
            {filteredForms.length > 0 ? (
              filteredForms.map((form) => {
                const formCount = responses.filter((response) => response.formId === form.id).length;

                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedFormId(form.id)}
                    className={`w-full rounded-[1.5rem] border p-4 text-left ${
                      selectedForm?.id === form.id
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{form.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{form.description}</p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        {formCount} rows
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">{form.audience}</p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                No attendance forms match the current filters.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Attendance roster
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            {selectedForm?.title ?? "Select an attendance form"}
          </h2>
          <p className="mt-2 text-slate-600">
            {selectedForm?.audience ?? "-"} | {filters.date || "All dates"}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Submissions</p>
              <p className="mt-3 text-3xl font-semibold">{summary.total}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-800">
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Matched users</p>
              <p className="mt-3 text-3xl font-semibold">{summary.matched}</p>
            </div>
            <div className="rounded-[1.5rem] bg-amber-50 p-4 text-amber-800">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-600">Unmatched</p>
              <p className="mt-3 text-3xl font-semibold">{summary.unmatched}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4 text-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Latest submit</p>
              <p className="mt-3 text-lg font-semibold">{summary.latest}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {attendeeRows.length > 0 ? (
              attendeeRows.map((row) => (
                <div key={row.response.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{row.name}</p>
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Present via form
                        </span>
                        {row.matchedMember ? (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                            Matched user
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{row.phone}</p>
                      <p className="mt-1 text-sm text-slate-500">{row.email}</p>
                    </div>
                    <div className="text-sm text-slate-500 lg:text-right">
                      <p>{row.submittedAt}</p>
                      <p className="mt-1">{row.location}</p>
                      <p className="mt-1">{row.device}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                No attendance submissions were found for this form and date. Once users submit the attendance form, they will appear here automatically.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
