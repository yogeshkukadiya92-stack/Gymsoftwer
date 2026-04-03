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

function buildCountRows(values: string[]) {
  const counts = new Map<string, number>();

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });

  return Array.from(counts.entries())
    .sort(([, left], [, right]) => right - left)
    .map(([label, count]) => ({ label, count }));
}

function getWeekKey(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
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

  const allAttendanceResponses = responses.filter((response) =>
    forms.some((form) => form.id === response.formId),
  );
  const weeklyRows = Array.from(
    allAttendanceResponses.reduce((map, response) => {
      const [datePart = ""] = response.submittedAt.split(" ");
      const weekKey = datePart ? getWeekKey(datePart) : "Unknown";
      map.set(weekKey, (map.get(weekKey) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([week, count]) => ({ week, count }));
  const dailyRows = Array.from(
    allAttendanceResponses.reduce((map, response) => {
      const [datePart = ""] = response.submittedAt.split(" ");
      map.set(datePart || "Unknown", (map.get(datePart || "Unknown") ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-10)
    .map(([date, count]) => ({ date, count }));
  const topForms = forms
    .map((form) => ({
      id: form.id,
      title: form.title,
      count: responses.filter((response) => response.formId === form.id).length,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  const countryRows = buildCountRows(
    allAttendanceResponses.map((response) => response.metadata?.country || "Unknown"),
  ).slice(0, 5);
  const deviceRows = buildCountRows(
    allAttendanceResponses.map((response) => response.metadata?.deviceType || "Unknown"),
  ).slice(0, 5);
  const maxWeeklyCount = Math.max(...weeklyRows.map((row) => row.count), 1);
  const maxDailyCount = Math.max(...dailyRows.map((row) => row.count), 1);
  const totalMatchedResponses = allAttendanceResponses.filter((response) => response.memberId).length;
  const totalUnmatchedResponses = allAttendanceResponses.length - totalMatchedResponses;
  const currentWeekKey = getWeekKey(new Date().toISOString().slice(0, 10));
  const currentWeekResponses = allAttendanceResponses.filter((response) => {
    const [datePart = ""] = response.submittedAt.split(" ");
    return datePart && getWeekKey(datePart) === currentWeekKey;
  });
  const currentWeekUniquePhones = new Set(
    currentWeekResponses
      .map((response) => response.respondentPhone?.trim() || "")
      .filter(Boolean),
  );
  const currentWeekUniqueMembers = new Set(
    currentWeekResponses
      .map((response) => response.memberId?.trim() || "")
      .filter(Boolean),
  );
  const currentWeekParticipants =
    currentWeekUniqueMembers.size + currentWeekUniquePhones.size;
  const totalMembers = members.length;
  const participationRate =
    totalMembers > 0 ? Math.round((currentWeekParticipants / totalMembers) * 100) : 0;
  const selectedFormWeeklyResponses = selectedForm
    ? currentWeekResponses.filter((response) => response.formId === selectedForm.id)
    : [];
  const shareableWeeklySummaryLines = [
    "Weekly attendance summary",
    `Week starting: ${currentWeekKey}`,
    `Total users: ${totalMembers}`,
    `Participants from total users: ${currentWeekParticipants}/${totalMembers} (${participationRate}%)`,
    `Total attendance form submissions: ${currentWeekResponses.length}`,
    `Estimated total participants: ${currentWeekParticipants}`,
    `Matched users: ${currentWeekResponses.filter((response) => response.memberId).length}`,
  ];

  if (selectedForm) {
    shareableWeeklySummaryLines.push(
      `${selectedForm.title} submissions: ${selectedFormWeeklyResponses.length}`,
    );
  }

  const shareableWeeklySummary = shareableWeeklySummaryLines.join("\n");

  async function handleCopyWeeklySummary() {
    try {
      await navigator.clipboard.writeText(shareableWeeklySummary);
    } catch {
      // no-op fallback for unsupported environments
    }
  }

  const weeklyWhatsAppHref = `https://wa.me/?text=${encodeURIComponent(shareableWeeklySummary)}`;

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

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Attendance reports
        </p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">
          Weekly participation and attendance analysis
        </h2>
        <p className="mt-2 text-slate-600">
          Review overall participation, trends, top attendance forms, and device or location patterns from submitted attendance forms.
        </p>

        <div className="mt-5 rounded-[1.5rem] border border-orange-200 bg-orange-50/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                Shareable weekly summary
              </p>
              <h3 className="mt-2 font-serif text-xl text-slate-950">
                Weekly participation report
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                Share a simple weekly report with total participants and attendance form submissions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleCopyWeeklySummary()}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Copy summary
              </button>
              <a
                href={weeklyWhatsAppHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Share on WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600">Week</p>
              <p className="mt-2 font-semibold text-slate-950">{currentWeekKey}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600">Total users</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{totalMembers}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600">Participants</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{currentWeekParticipants}</p>
              <p className="mt-1 text-sm text-slate-500">{participationRate}% of total users</p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600">All submissions</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{currentWeekResponses.length}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-600">Selected form</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{selectedFormWeeklyResponses.length}</p>
            </div>
          </div>

          <pre className="mt-4 whitespace-pre-wrap rounded-[1.25rem] bg-white p-4 text-sm text-slate-700">
            {shareableWeeklySummary}
          </pre>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Total attendance</p>
            <p className="mt-3 text-3xl font-semibold">{allAttendanceResponses.length}</p>
          </div>
          <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-800">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Matched users</p>
            <p className="mt-3 text-3xl font-semibold">{totalMatchedResponses}</p>
          </div>
          <div className="rounded-[1.5rem] bg-amber-50 p-4 text-amber-800">
            <p className="text-sm uppercase tracking-[0.24em] text-amber-600">Unmatched</p>
            <p className="mt-3 text-3xl font-semibold">{totalUnmatchedResponses}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-4 text-slate-900">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Attendance forms</p>
            <p className="mt-3 text-3xl font-semibold">{forms.length}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <h3 className="font-serif text-xl text-slate-950">Weekly participation</h3>
            <div className="mt-4 space-y-3">
              {weeklyRows.length > 0 ? (
                weeklyRows.map((row) => (
                  <div key={row.week}>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                      <span>Week of {row.week}</span>
                      <span className="font-semibold">{row.count}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-slate-950"
                        style={{ width: `${(row.count / maxWeeklyCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Weekly attendance data will appear here once submissions are available.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <h3 className="font-serif text-xl text-slate-950">Last 10 days trend</h3>
            <div className="mt-4 space-y-3">
              {dailyRows.length > 0 ? (
                dailyRows.map((row) => (
                  <div key={row.date}>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                      <span>{row.date}</span>
                      <span className="font-semibold">{row.count}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-orange-100">
                      <div
                        className="h-3 rounded-full bg-orange-500"
                        style={{ width: `${(row.count / maxDailyCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Daily participation trend will appear here once submissions are available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <h3 className="font-serif text-xl text-slate-950">Top attendance forms</h3>
            <div className="mt-4 space-y-3">
              {topForms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-900">{form.title}</span>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {form.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <h3 className="font-serif text-xl text-slate-950">Country breakdown</h3>
            <div className="mt-4 space-y-3">
              {countryRows.length > 0 ? (
                countryRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-900">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{row.count}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Country-level response data is not available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 p-5">
            <h3 className="font-serif text-xl text-slate-950">Device breakdown</h3>
            <div className="mt-4 space-y-3">
              {deviceRows.length > 0 ? (
                deviceRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-900">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{row.count}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Device-level response data is not available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
