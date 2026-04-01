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
  textareaClassName,
  tableBodyCellClassName,
  tableClassName,
  tableHeaderCellClassName,
  tableRowClassName,
  tableShellClassName,
} from "@/components/filter-toolbar";
import {
  fieldTypeDefinitions,
  fieldTypeNeedsOptions,
  IntakeForm,
  IntakeFormField,
  IntakeFormResponse,
  NewIntakeFormInput,
} from "@/lib/forms";

type FormResponsesWorkspaceProps = {
  forms: IntakeForm[];
  responses: IntakeFormResponse[];
};

type EditorField = IntakeFormField & {
  optionsText?: string;
};

function toEditorField(field: IntakeFormField): EditorField {
  return {
    ...field,
    optionsText: field.options?.join(", ") ?? "",
  };
}

function toSavedField(field: EditorField): IntakeFormField {
  return {
    id: field.id,
    label: field.label.trim() || "Untitled question",
    type: field.type,
    required: field.required,
    options: fieldTypeNeedsOptions(field.type)
      ? (field.optionsText ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
    condition: field.condition,
    scaleMin: field.scaleMin,
    scaleMax: field.scaleMax,
    scaleLowLabel: field.scaleLowLabel,
    scaleHighLabel: field.scaleHighLabel,
  };
}

function makeEditorField(): EditorField {
  return {
    id: `field-${crypto.randomUUID()}`,
    label: "",
    type: "short_text",
    required: true,
    options: [],
    optionsText: "",
  };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

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
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isSavingInline, setIsSavingInline] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [creatingUserResponseId, setCreatingUserResponseId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<NewIntakeFormInput>({
    title: "",
    description: "",
    audience: "",
    fields: [],
  });
  const [inlineFields, setInlineFields] = useState<EditorField[]>([]);

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
  const selectedFormShareUrl =
    selectedForm && typeof window !== "undefined"
      ? `${window.location.origin}/forms/${selectedForm.slug}`
      : selectedForm
        ? `/forms/${selectedForm.slug}`
        : "";

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

  function openInlineEditor() {
    if (!selectedForm) {
      return;
    }

    setInlineForm({
      title: selectedForm.title,
      description: selectedForm.description,
      audience: selectedForm.audience,
      fields: selectedForm.fields,
    });
    setInlineFields(selectedForm.fields.map(toEditorField));
    setCreateMessage("");
    setIsEditingInline(true);
  }

  function syncInlineFields(nextFields: EditorField[]) {
    setInlineFields(nextFields);
    setInlineForm((current) => ({
      ...current,
      fields: nextFields.map(toSavedField),
    }));
  }

  function moveInlineFieldById(sourceId: string, targetId: string) {
    const sourceIndex = inlineFields.findIndex((item) => item.id === sourceId);
    const targetIndex = inlineFields.findIndex((item) => item.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    syncInlineFields(moveItem(inlineFields, sourceIndex, targetIndex));
  }

  async function saveInlineForm() {
    if (!selectedForm || !inlineForm.title.trim()) {
      return;
    }

    setIsSavingInline(true);
    setCreateMessage("");

    const response = await fetch("/api/admin/forms", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: selectedForm.id,
        ...inlineForm,
        fields: inlineFields.map(toSavedField),
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      form?: IntakeForm;
    };

    if (response.ok && payload.form) {
      setFormsState((current) =>
        current.map((form) => (form.id === payload.form!.id ? payload.form! : form)),
      );
      setSelectedFormId(payload.form.id);
      setCreateMessage(payload.message ?? "Form updated successfully.");
      setIsEditingInline(false);
    } else {
      setCreateMessage(payload.error ?? "Form update failed.");
    }

    setIsSavingInline(false);
  }

  async function copyPublicLink() {
    if (!selectedFormShareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedFormShareUrl);
      setCreateMessage("Public form link copied successfully.");
    } catch {
      setCreateMessage(selectedFormShareUrl);
    }
  }

  async function duplicateSelectedForm() {
    if (!selectedForm) {
      return;
    }

    setIsDuplicating(true);
    setCreateMessage("");

    const response = await fetch("/api/admin/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `${selectedForm.title} Copy`,
        description: selectedForm.description,
        audience: selectedForm.audience,
        fields: selectedForm.fields,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      form?: IntakeForm;
      sharePath?: string;
      message?: string;
    };

    if (response.ok && payload.form) {
      setFormsState((current) => [payload.form!, ...current]);
      setSelectedFormId(payload.form.id);
      setCreateMessage(payload.message ?? "Form duplicated successfully.");
    } else {
      setCreateMessage(payload.error ?? "Form duplicate failed.");
    }

    setIsDuplicating(false);
  }

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

  async function handleCreateUserFromResponse(response: IntakeFormResponse) {
    if (!selectedForm) {
      return;
    }

    const fullName =
      getResponseFieldValue(selectedForm, response, {
        labelPattern: /full\s*name|name/i,
      }) || "Form user";
    const email = getResponseFieldValue(selectedForm, response, { type: "email" });
    const phone = getResponseFieldValue(selectedForm, response, { type: "phone" });

    if (!email.trim()) {
      setCreateMessage("This response does not contain an email field, so a user cannot be created automatically.");
      return;
    }

    setCreatingUserResponseId(response.id);
    setCreateMessage("");

    const createUserResponse = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        role: "member",
      }),
    });

    const createUserPayload = (await createUserResponse.json()) as {
      error?: string;
      message?: string;
      user?: { id: string };
    };

    if (!createUserResponse.ok || !createUserPayload.user?.id) {
      setCreateMessage(createUserPayload.error ?? "User create failed.");
      setCreatingUserResponseId(null);
      return;
    }

    const matchResponse = await fetch("/api/admin/form-responses/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        responseId: response.id,
        memberId: createUserPayload.user.id,
        respondentPhone: phone || response.respondentPhone || "",
      }),
    });

    const matchPayload = (await matchResponse.json()) as { error?: string; message?: string };

    if (!matchResponse.ok) {
      setCreateMessage(matchPayload.error ?? "User created, but response match failed.");
      setCreatingUserResponseId(null);
      return;
    }

    setResponsesState((current) =>
      current.map((item) =>
        item.id === response.id
          ? {
              ...item,
              memberId: createUserPayload.user!.id,
              respondentPhone: phone || item.respondentPhone,
            }
          : item,
      ),
    );
    setCreateMessage(createUserPayload.message ?? "User created successfully.");
    setCreatingUserResponseId(null);
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
              <button
                type="button"
                onClick={openInlineEditor}
                className={secondaryButtonClassName}
              >
                Inline edit form
              </button>
              <button
                type="button"
                onClick={() => void duplicateSelectedForm()}
                disabled={isDuplicating}
                className={secondaryButtonClassName}
              >
                {isDuplicating ? "Duplicating..." : "Duplicate form"}
              </button>
              <button
                type="button"
                onClick={() => void copyPublicLink()}
                className={secondaryButtonClassName}
              >
                Copy public link
              </button>
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
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Matched users</p>
              <p className="mt-3 text-3xl font-semibold">
                {selectedResponses.filter((response) => response.memberId).length}
              </p>
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

        {isEditingInline ? (
          <div className="rounded-[2rem] border border-orange-200 bg-orange-50/70 p-6 shadow-[0_24px_80px_rgba(249,115,22,0.10)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                  Inline editor
                </p>
                <h3 className="mt-2 font-serif text-2xl text-slate-950">
                  Edit selected form here
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className={secondaryButtonClassName}
              >
                Close editor
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <input
                value={inlineForm.title}
                onChange={(event) =>
                  setInlineForm((current) => ({ ...current, title: event.target.value }))
                }
                className={fieldClassName}
                placeholder="Form title"
              />
              <textarea
                value={inlineForm.description}
                onChange={(event) =>
                  setInlineForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className={textareaClassName}
                placeholder="Description"
              />
              <input
                value={inlineForm.audience}
                onChange={(event) =>
                  setInlineForm((current) => ({ ...current, audience: event.target.value }))
                }
                className={fieldClassName}
                placeholder="Audience"
              />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Questions
                </p>
                <button
                  type="button"
                  onClick={() => syncInlineFields([...inlineFields, makeEditorField()])}
                  className={secondaryButtonClassName}
                >
                  Add question
                </button>
              </div>

              {inlineFields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => setDraggingFieldId(field.id)}
                  onDragEnd={() => setDraggingFieldId(null)}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={() => {
                    if (!draggingFieldId || draggingFieldId === field.id) {
                      return;
                    }

                    moveInlineFieldById(draggingFieldId, field.id);
                    setDraggingFieldId(null);
                  }}
                  className={`rounded-[1.5rem] border bg-white p-4 ${
                    draggingFieldId === field.id
                      ? "border-orange-300 ring-2 ring-orange-100"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">Question {index + 1}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        Drag to reorder
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() =>
                          syncInlineFields(moveItem(inlineFields, index, index - 1))
                        }
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        disabled={index === inlineFields.length - 1}
                        onClick={() =>
                          syncInlineFields(moveItem(inlineFields, index, index + 1))
                        }
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Move down
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          syncInlineFields(inlineFields.filter((item) => item.id !== field.id))
                        }
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <input
                      value={field.label}
                      onChange={(event) =>
                        syncInlineFields(
                          inlineFields.map((item) =>
                            item.id === field.id ? { ...item, label: event.target.value } : item,
                          ),
                        )
                      }
                      className={fieldClassName}
                      placeholder="Question label"
                    />
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <select
                        value={field.type}
                        onChange={(event) =>
                          syncInlineFields(
                            inlineFields.map((item) =>
                              item.id === field.id
                                ? {
                                    ...item,
                                    type: event.target.value as IntakeFormField["type"],
                                  }
                                : item,
                            ),
                          )
                        }
                        className={fieldClassName}
                      >
                        {fieldTypeDefinitions.map((definition) => (
                          <option key={definition.type} value={definition.type}>
                            {definition.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            syncInlineFields(
                              inlineFields.map((item) =>
                                item.id === field.id
                                  ? { ...item, required: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        Required
                      </label>
                    </div>

                    {fieldTypeNeedsOptions(field.type) ? (
                      <input
                        value={field.optionsText ?? ""}
                        onChange={(event) =>
                          syncInlineFields(
                            inlineFields.map((item) =>
                              item.id === field.id
                                ? { ...item, optionsText: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={fieldClassName}
                        placeholder="Enter options separated by commas"
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void saveInlineForm()}
                disabled={isSavingInline}
                className={primaryButtonClassName}
              >
                {isSavingInline ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className={secondaryButtonClassName}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

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
                    <th className={tableHeaderCellClassName}>Match status</th>
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
                      <td className={tableBodyCellClassName}>
                        {response.memberId ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              Matched to user
                            </span>
                            <span className="text-xs text-slate-500">
                              {response.respondentPhone || "Phone matched"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                              Unmatched response
                            </span>
                            <span className="text-xs text-slate-500">
                              {response.respondentPhone || "No matching phone found"}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleCreateUserFromResponse(response)}
                              disabled={creatingUserResponseId === response.id}
                              className="mt-2 inline-flex w-fit items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {creatingUserResponseId === response.id
                                ? "Creating..."
                                : "Create user"}
                            </button>
                          </div>
                        )}
                      </td>
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
