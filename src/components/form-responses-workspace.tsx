"use client";

import { useMemo, useState } from "react";

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
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? "");
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

  const selectedForm =
    formsState.find((form) => form.id === selectedFormId) ?? formsState[0];
  const selectedResponses = useMemo(() => {
    const formResponses = responses.filter((response) => response.formId === selectedForm?.id);

    return formResponses.filter((response) => {
      const [datePart = "", timePart = ""] = response.submittedAt.split(" ");
      const normalizedResponseDate = datePart;
      const normalizedResponseTime = timePart;

      const matchesDate = !selectedDate || normalizedResponseDate === selectedDate;
      const matchesFromTime = !fromTime || normalizedResponseTime >= fromTime;
      const matchesToTime = !toTime || normalizedResponseTime <= toTime;

      return matchesDate && matchesFromTime && matchesToTime;
    });
  }, [responses, selectedForm, selectedDate, fromTime, toTime]);

  const columns = selectedForm
    ? [
        { id: "submittedAt", label: "Submitted At" },
        ...selectedForm.fields.map((field) => ({
          id: field.id,
          label: field.label,
        })),
      ]
    : [];

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
            const count = responses.filter((response) => response.formId === form.id).length;

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
            Google Form jeva raw responses niche table format ma dekhashe.
          </p>
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
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Filter by date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedDate("");
                setFromTime("");
                setToTime("");
              }}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Reset time filters
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
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
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.id} className="px-4 py-4 font-medium whitespace-nowrap">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedResponses.map((response, index) => (
                    <tr
                      key={response.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      {columns.map((column) => (
                        <td
                          key={`${response.id}-${column.id}`}
                          className="border-t border-slate-200 px-4 py-4 align-top text-slate-700"
                        >
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
              <div className="px-6 py-10 text-slate-600">
                No responses are available for this form yet. Select another form or collect data through the public form link.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
