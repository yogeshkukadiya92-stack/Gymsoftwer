"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  emptyStateClassName,
  fieldClassName,
  FilterToolbar,
  FilterToolbarAction,
  FilterToolbarItem,
  FilterToolbarSearch,
  secondaryButtonClassName,
  primaryButtonClassName,
  tableBodyCellClassName,
  tableClassName,
  tableHeaderCellClassName,
  tableRowClassName,
  tableShellClassName,
} from "@/components/filter-toolbar";
import { IntakeForm, IntakeFormResponse, NewIntakeFormInput } from "@/lib/forms";

type FormResponsesWorkspaceProps = {
  forms: IntakeForm[];
  responses: IntakeFormResponse[];
};

export function FormResponsesWorkspace({
  forms,
  responses,
}: FormResponsesWorkspaceProps) {
  const [formsState, setFormsState] = useState(forms);
  const [responsesState, setResponsesState] = useState(responses);
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [newForm, setNewForm] = useState<NewIntakeFormInput>({
    title: "",
    description: "",
    audience: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedForm =
    formsState.find((form) => form.id === selectedFormId) ?? formsState[0];
  const selectedResponses = useMemo(() => {
    const formResponses = responsesState.filter((response) => response.formId === selectedForm?.id);

    return formResponses.filter((response) => {
      const [datePart = "", timePart = ""] = response.submittedAt.split(" ");
      const normalizedResponseDate = datePart;
      const normalizedResponseTime = timePart;
      const matchesSearch =
        !searchQuery.trim() ||
        response.submittedAt.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        Object.values(response.answers).join(" ").toLowerCase().includes(searchQuery.trim().toLowerCase());

      const matchesDate = !selectedDate || normalizedResponseDate === selectedDate;
      const matchesFromTime = !fromTime || normalizedResponseTime >= fromTime;
      const matchesToTime = !toTime || normalizedResponseTime <= toTime;

      return matchesDate && matchesFromTime && matchesToTime && matchesSearch;
    });
  }, [responsesState, searchQuery, selectedForm, selectedDate, fromTime, toTime]);

  const columns = selectedForm
    ? [
        { id: "submittedAt", label: "Submitted At" },
        ...selectedForm.fields.map((field) => ({
          id: field.id,
          label: field.label,
        })),
      ]
    : [];
  const selectedFormIdForExport = selectedForm?.id ?? "";
  const exportUrl = (() => {
    const params = new URLSearchParams();
    if (selectedFormIdForExport) params.set("formId", selectedFormIdForExport);
    if (selectedDate) params.set("date", selectedDate);
    if (fromTime) params.set("fromTime", fromTime);
    if (toTime) params.set("toTime", toTime);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    return `/api/admin/form-responses/export?${params.toString()}`;
  })();

  async function handleDeleteSelectedForm() {
    if (!selectedForm) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${selectedForm.title}"? This will also remove its saved responses from the app.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setCreateMessage("");

    const response = await fetch("/api/admin/forms", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: selectedForm.id }),
    });

    const payload = (await response.json()) as { message?: string; error?: string };

    if (response.ok) {
      const nextForms = formsState.filter((form) => form.id !== selectedForm.id);
      setFormsState(nextForms);
      setResponsesState((current) =>
        current.filter((item) => item.formId !== selectedForm.id),
      );
      setSelectedFormId(nextForms[0]?.id ?? "");
      setCreateMessage(payload.message ?? "Form deleted successfully.");
    } else {
      setCreateMessage(payload.error ?? "Form delete failed.");
    }

    setIsDeleting(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Form selector
        </p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">
          Select any form
        </h2>
        <div className="mt-5 grid gap-3">
          {formsState.map((form) => {
            const count = responsesState.filter((response) => response.formId === form.id).length;

            return (
              <button
                key={form.id}
                type="button"
                onClick={() => setSelectedFormId(form.id)}
                className={`rounded-[1.5rem] border p-4 text-left ${
                  selectedForm?.id === form.id
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{form.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{form.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {count} rows
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{form.audience}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Create new form
          </p>
          <h3 className="mt-2 font-serif text-xl text-slate-950">
            Create a new form directly from the responses page
          </h3>
          <div className="mt-4 grid gap-3">
            <input
              value={newForm.title}
              onChange={(event) =>
                setNewForm((current) => ({ ...current, title: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Form title"
            />
            <textarea
              value={newForm.description}
              onChange={(event) =>
                setNewForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-24 rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Description"
            />
            <input
              value={newForm.audience}
              onChange={(event) =>
                setNewForm((current) => ({ ...current, audience: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Audience"
            />
            <button
              type="button"
              disabled={isCreating}
              onClick={async () => {
                if (!newForm.title.trim()) {
                  return;
                }

                setIsCreating(true);
                setCreateMessage("");

                const response = await fetch("/api/admin/forms", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(newForm),
                });

                const payload = (await response.json()) as {
                  error?: string;
                  form?: IntakeForm;
                  sharePath?: string;
                };

                if (response.ok && payload.form) {
                  setFormsState((current) => [payload.form!, ...current]);
                  setSelectedFormId(payload.form.id);
                  setNewForm({
                    title: "",
                    description: "",
                    audience: "",
                  });
                  setCreateMessage(
                    `Form created. Share link: ${payload.sharePath ?? `/forms/${payload.form.slug}`}`,
                  );
                } else {
                  setCreateMessage(payload.error ?? "Form create failed.");
                }

                setIsCreating(false);
              }}
              className="rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-70"
            >
              {isCreating ? "Creating..." : "Create new form"}
            </button>
            {createMessage ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                {createMessage}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Response summary
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            {selectedForm?.title ?? "No form selected"}
          </h2>
          <p className="mt-2 text-slate-600">
            Raw responses for the selected form appear below in a table layout.
          </p>
          {selectedForm ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/admin/forms" className={primaryButtonClassName}>
                Open form editor
              </Link>
              <a
                href={`/forms/${selectedForm.slug}`}
                target="_blank"
                rel="noreferrer"
                className={secondaryButtonClassName}
              >
                Open public form
              </a>
              <button
                type="button"
                onClick={() => void handleDeleteSelectedForm()}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete selected form"}
              </button>
            </div>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Responses</p>
              <p className="mt-3 text-3xl font-semibold">{selectedResponses.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4 text-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Columns</p>
              <p className="mt-3 text-3xl font-semibold">{columns.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-orange-50 p-4 text-orange-900">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-600">Audience</p>
              <p className="mt-3 text-xl font-semibold">{selectedForm?.audience ?? "-"}</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <FilterToolbar>
              <FilterToolbarItem className="min-w-[16rem] flex-[1.6]">
                <FilterToolbarSearch
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search inside submitted answers"
                />
              </FilterToolbarItem>
              <FilterToolbarAction href={exportUrl}>Export current view</FilterToolbarAction>
            </FilterToolbar>
            <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Filter by date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                From time
              </span>
              <input
                type="time"
                value={fromTime}
                onChange={(event) => setFromTime(event.target.value)}
                className={fieldClassName}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                To time
              </span>
              <input
                type="time"
                value={toTime}
                onChange={(event) => setToTime(event.target.value)}
                className={fieldClassName}
              />
            </label>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("");
                  setFromTime("");
                  setToTime("");
                  setSearchQuery("");
                }}
                className={secondaryButtonClassName}
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>

        <div className={tableShellClassName}>
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              Raw table
            </p>
            <h3 className="mt-2 font-serif text-2xl text-slate-950">
              Column wise responses
            </h3>
          </div>
          <div className="overflow-x-auto">
            {selectedResponses.length > 0 ? (
              <table className={tableClassName}>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.id} className={tableHeaderCellClassName}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedResponses.map((response) => (
                    <tr key={response.id} className={tableRowClassName}>
                      {columns.map((column) => (
                        <td key={`${response.id}-${column.id}`} className={tableBodyCellClassName}>
                          {column.id === "submittedAt"
                            ? response.submittedAt
                            : response.answers[column.id] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={`m-6 ${emptyStateClassName}`}>
                No responses are available for this form yet. Select another form or collect data through the public form link.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
