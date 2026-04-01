"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  accentButtonClassName,
  emptyStateClassName,
  errorMessageClassName,
  fieldClassName,
  FilterToolbar,
  FilterToolbarAction,
  FilterToolbarItem,
  FilterToolbarSearch,
  FilterToolbarSelect,
  panelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  successMessageClassName,
  textareaClassName,
} from "@/components/filter-toolbar";
import {
  FieldCondition,
  fieldTypeDefinitions,
  fieldTypeNeedsOptions,
  IntakeForm,
  IntakeFormField,
  IntakeFormResponse,
  NewIntakeFormInput,
} from "@/lib/forms";

type FormsWorkspaceProps = {
  initialForms: IntakeForm[];
  initialResponses: IntakeFormResponse[];
};

type CreateFormResult = {
  message?: string;
  error?: string;
  form?: IntakeForm;
  sharePath?: string;
};

type BuilderField = IntakeFormField & {
  optionsText?: string;
  conditionFieldId?: string;
  conditionEquals?: string;
};

function makeFieldId() {
  return `field-${crypto.randomUUID()}`;
}

function createEmptyField(): BuilderField {
  return {
    id: makeFieldId(),
    label: "",
    type: "short_text",
    required: true,
    options: [],
    optionsText: "",
    conditionFieldId: "",
    conditionEquals: "",
    scaleMin: 1,
    scaleMax: 5,
    scaleLowLabel: "Low",
    scaleHighLabel: "High",
  };
}

function toBuilderField(field: IntakeFormField): BuilderField {
  return {
    ...field,
    optionsText: field.options?.join(", ") ?? "",
    conditionFieldId: field.condition?.fieldId ?? "",
    conditionEquals: field.condition?.equals ?? "",
    scaleMin: field.scaleMin ?? 1,
    scaleMax: field.scaleMax ?? 5,
    scaleLowLabel: field.scaleLowLabel ?? "Low",
    scaleHighLabel: field.scaleHighLabel ?? "High",
  };
}

function toFormField(field: BuilderField): IntakeFormField {
  const supportsOptions = fieldTypeNeedsOptions(field.type);

  const condition: FieldCondition | undefined =
    field.conditionFieldId && field.conditionEquals
      ? {
          fieldId: field.conditionFieldId,
          equals: field.conditionEquals,
        }
      : undefined;

  return {
    id: field.id,
    label: field.label.trim() || "Untitled question",
    type: field.type,
    required: field.required,
    options: supportsOptions
      ? (field.optionsText ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
    condition,
    scaleMin:
      field.type === "linear_scale"
        ? Math.min(field.scaleMin ?? 1, field.scaleMax ?? 5)
        : undefined,
    scaleMax:
      field.type === "linear_scale"
        ? Math.max(field.scaleMin ?? 1, field.scaleMax ?? 5)
        : undefined,
    scaleLowLabel: field.type === "linear_scale" ? (field.scaleLowLabel ?? "Low") : undefined,
    scaleHighLabel:
      field.type === "linear_scale" ? (field.scaleHighLabel ?? "High") : undefined,
  };
}

const initialFields: IntakeFormField[] = [
  {
    id: "name",
    label: "Full name",
    type: "short_text",
    required: true,
  },
  {
    id: "phone",
    label: "Phone number",
    type: "phone",
    required: true,
  },
];

const initialFormState: NewIntakeFormInput = {
  title: "",
  description: "",
  audience: "",
  fields: initialFields,
};

export function FormsWorkspace({
  initialForms,
  initialResponses,
}: FormsWorkspaceProps) {
  const [forms, setForms] = useState<IntakeForm[]>(initialForms);
  const [responses, setResponses] = useState<IntakeFormResponse[]>(initialResponses);
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("All audiences");
  const [sortBy, setSortBy] = useState<"title" | "responsesHigh" | "audience">("title");
  const [selectedFormId, setSelectedFormId] = useState(initialForms[0]?.id ?? "");
  const [formState, setFormState] = useState<NewIntakeFormInput>(initialFormState);
  const [builderFields, setBuilderFields] = useState<BuilderField[]>(
    initialFields.map(toBuilderField),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<CreateFormResult | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [fieldTypeSearch, setFieldTypeSearch] = useState("");
  const [isDeletingFormId, setIsDeletingFormId] = useState<string | null>(null);

  const audienceOptions = useMemo(
    () => Array.from(new Set(forms.map((form) => form.audience).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [forms],
  );
  const filteredForms = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return [...forms]
      .filter((form) => {
        const matchesSearch =
          !normalized ||
          [form.title, form.description, form.audience].join(" ").toLowerCase().includes(normalized);
        const matchesAudience = audienceFilter === "All audiences" || form.audience === audienceFilter;
        return matchesSearch && matchesAudience;
      })
      .sort((a, b) => {
        const responseCountA = responses.filter((response) => response.formId === a.id).length;
        const responseCountB = responses.filter((response) => response.formId === b.id).length;

        switch (sortBy) {
          case "responsesHigh":
            return responseCountB - responseCountA || a.title.localeCompare(b.title);
          case "audience":
            return a.audience.localeCompare(b.audience) || a.title.localeCompare(b.title);
          case "title":
          default:
            return a.title.localeCompare(b.title);
        }
      });
  }, [audienceFilter, forms, responses, searchQuery, sortBy]);
  const selectedForm =
    filteredForms.find((form) => form.id === selectedFormId) ??
    forms.find((form) => form.id === selectedFormId) ??
    filteredForms[0] ??
    forms[0];
  const selectedResponses = useMemo(
    () => responses.filter((response) => response.formId === selectedForm?.id),
    [responses, selectedForm],
  );
  const filteredExportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (audienceFilter !== "All audiences") params.set("audience", audienceFilter);
    params.set("sort", sortBy);
    return `/api/admin/forms/export?${params.toString()}`;
  }, [audienceFilter, searchQuery, sortBy]);

  function syncFields(nextFields: BuilderField[]) {
    setBuilderFields(nextFields);
    setFormState((current) => ({
      ...current,
      fields: nextFields.map(toFormField),
    }));
  }

  function resetBuilder() {
    setFormState(initialFormState);
    setBuilderFields(initialFields.map(toBuilderField));
    setEditingFormId(null);
  }

  function loadFormIntoBuilder(form: IntakeForm) {
    setEditingFormId(form.id);
    setFormState({
      title: form.title,
      description: form.description,
      audience: form.audience,
      fields: form.fields,
    });
    setBuilderFields(form.fields.map(toBuilderField));
    setCreateResult(null);
  }

  async function createForm() {
    if (!formState.title.trim()) {
      return;
    }

    setIsCreating(true);
    setCreateResult(null);

    const response = await fetch("/api/admin/forms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json()) as CreateFormResult;

    if (response.ok && payload.form) {
      setForms((current) => [payload.form!, ...current]);
      setSelectedFormId(payload.form.id);
      resetBuilder();
    }

    setCreateResult(payload);
    setIsCreating(false);
  }

  async function saveFormChanges() {
    if (!editingFormId || !formState.title.trim()) {
      return;
    }

    setIsCreating(true);
    setCreateResult(null);

    const response = await fetch("/api/admin/forms", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: editingFormId,
        ...formState,
      }),
    });

    const payload = (await response.json()) as CreateFormResult;

    if (response.ok && payload.form) {
      setForms((current) =>
        current.map((form) => (form.id === payload.form!.id ? payload.form! : form)),
      );
      setSelectedFormId(payload.form.id);
      resetBuilder();
    }

    setCreateResult(payload);
    setIsCreating(false);
  }

  async function deleteForm(form: IntakeForm) {
    const confirmed = window.confirm(
      `Delete "${form.title}"? This will also remove its saved responses from the app.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingFormId(form.id);
    setCreateResult(null);

    const response = await fetch("/api/admin/forms", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: form.id }),
    });

    const payload = (await response.json()) as { message?: string; error?: string };

    if (response.ok) {
      const nextForms = forms.filter((item) => item.id !== form.id);
      setForms(nextForms);
      setResponses((current) => current.filter((item) => item.formId !== form.id));
      setSelectedFormId(nextForms[0]?.id ?? "");

      if (editingFormId === form.id) {
        resetBuilder();
      }

      setCreateResult({
        message: payload.message ?? "Form deleted successfully.",
      });
    } else {
      setCreateResult({
        error: payload.error ?? "Form delete failed.",
      });
    }

    setIsDeletingFormId(null);
  }

  const shareUrl =
    createResult?.sharePath && typeof window !== "undefined"
      ? `${window.location.origin}${createResult.sharePath}`
      : createResult?.sharePath;
  const selectedFormShareUrl =
    selectedForm && typeof window !== "undefined"
      ? `${window.location.origin}/forms/${selectedForm.slug}`
      : selectedForm
        ? `/forms/${selectedForm.slug}`
        : "";
  const filteredFieldTypes = useMemo(() => {
    const query = fieldTypeSearch.trim().toLowerCase();

    return fieldTypeDefinitions.filter((definition) => {
      if (!query) {
        return true;
      }

      return [definition.label, definition.description, definition.category]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [fieldTypeSearch]);
  const groupedFieldTypes = useMemo(() => {
    return filteredFieldTypes.reduce<Record<string, typeof fieldTypeDefinitions>>((groups, definition) => {
      const current = groups[definition.category] ?? [];
      groups[definition.category] = [...current, definition];
      return groups;
    }, {});
  }, [filteredFieldTypes]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <section className="space-y-6">
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            {editingFormId ? "Edit form" : "Create form"}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            {editingFormId
              ? "Edit selected form"
              : "Build an advanced custom form similar to Google Forms"}
          </h2>
          <div className="mt-5 grid gap-4">
            <input
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({ ...current, title: event.target.value }))
              }
              className={fieldClassName}
              placeholder="Form title"
            />
            <textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={textareaClassName}
              placeholder="What information do you want to collect?"
            />
            <input
              value={formState.audience}
              onChange={(event) =>
                setFormState((current) => ({ ...current, audience: event.target.value }))
              }
              className={fieldClassName}
              placeholder="Audience"
            />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Question types
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Pick a field type like a form builder, then add it to your form.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <input
                value={fieldTypeSearch}
                onChange={(event) => setFieldTypeSearch(event.target.value)}
                className={fieldClassName}
                placeholder="Find questions, input fields, and layout options..."
              />
            </div>
            <div className="mt-4 grid gap-4">
              {Object.entries(groupedFieldTypes).map(([category, definitions]) => (
                <div key={category} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {category}
                  </p>
                  <div className="grid gap-3">
                    {definitions.map((definition) => (
                      <button
                        key={definition.type}
                        type="button"
                        onClick={() =>
                          syncFields([
                            ...builderFields,
                            {
                              ...createEmptyField(),
                              type: definition.type,
                            },
                          ])
                        }
                        className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-orange-300 hover:bg-orange-50"
                      >
                        <p className="font-semibold text-slate-950">{definition.label}</p>
                        <p className="mt-1 text-sm text-slate-600">{definition.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredFieldTypes.length === 0 ? (
                <div className={emptyStateClassName}>
                  No question types match your search.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Questions
              </p>
              <button
                type="button"
                onClick={() => syncFields([...builderFields, createEmptyField()])}
                className={secondaryButtonClassName}
              >
                Add question
              </button>
            </div>

            {builderFields.map((field, index) => {
              const candidateParents = builderFields.filter((item) => item.id !== field.id);

              return (
                <div
                  key={field.id}
                  className="rounded-[1.5rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">Question {index + 1}</p>
                    <button
                      type="button"
                      onClick={() =>
                        syncFields(builderFields.filter((item) => item.id !== field.id))
                      }
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <input
                      value={field.label}
                      onChange={(event) =>
                        syncFields(
                          builderFields.map((item) =>
                            item.id === field.id
                              ? { ...item, label: event.target.value }
                              : item,
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
                          syncFields(
                            builderFields.map((item) =>
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
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            syncFields(
                              builderFields.map((item) =>
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
                          syncFields(
                            builderFields.map((item) =>
                              item.id === field.id
                                ? { ...item, optionsText: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={fieldClassName}
                        placeholder="Enter options separated by commas. Example: Beginner, Intermediate, Advanced"
                      />
                    ) : null}

                    {field.type === "linear_scale" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          type="number"
                          value={field.scaleMin ?? 1}
                          onChange={(event) =>
                            syncFields(
                              builderFields.map((item) =>
                                item.id === field.id
                                  ? { ...item, scaleMin: Number(event.target.value || 1) }
                                  : item,
                              ),
                            )
                          }
                          className={fieldClassName}
                          placeholder="Scale minimum"
                        />
                        <input
                          type="number"
                          value={field.scaleMax ?? 5}
                          onChange={(event) =>
                            syncFields(
                              builderFields.map((item) =>
                                item.id === field.id
                                  ? { ...item, scaleMax: Number(event.target.value || 5) }
                                  : item,
                              ),
                            )
                          }
                          className={fieldClassName}
                          placeholder="Scale maximum"
                        />
                        <input
                          value={field.scaleLowLabel ?? ""}
                          onChange={(event) =>
                            syncFields(
                              builderFields.map((item) =>
                                item.id === field.id
                                  ? { ...item, scaleLowLabel: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className={fieldClassName}
                          placeholder="Low label"
                        />
                        <input
                          value={field.scaleHighLabel ?? ""}
                          onChange={(event) =>
                            syncFields(
                              builderFields.map((item) =>
                                item.id === field.id
                                  ? { ...item, scaleHighLabel: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className={fieldClassName}
                          placeholder="High label"
                        />
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <select
                        value={field.conditionFieldId ?? ""}
                        onChange={(event) =>
                          syncFields(
                            builderFields.map((item) =>
                              item.id === field.id
                                ? { ...item, conditionFieldId: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={fieldClassName}
                      >
                        <option value="">Always show</option>
                        {candidateParents.map((item) => (
                          <option key={item.id} value={item.id}>
                            Show when {item.label || `Question ${candidateParents.indexOf(item) + 1}`}
                          </option>
                        ))}
                      </select>
                      <input
                        value={field.conditionEquals ?? ""}
                        onChange={(event) =>
                          syncFields(
                            builderFields.map((item) =>
                              item.id === field.id
                                ? { ...item, conditionEquals: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className={fieldClassName}
                        placeholder="Show if answer equals..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={editingFormId ? saveFormChanges : createForm}
                disabled={isCreating}
                className={accentButtonClassName}
              >
                {isCreating
                  ? editingFormId
                    ? "Saving changes..."
                    : "Creating form..."
                  : editingFormId
                    ? "Save changes"
                    : "Create form"}
              </button>
              {editingFormId ? (
                <button
                  type="button"
                  onClick={resetBuilder}
                  className={secondaryButtonClassName}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>

          {createResult ? (
            <div className="mt-5 rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.96))] p-4">
              {createResult.error ? (
                <p className={errorMessageClassName}>{createResult.error}</p>
              ) : null}
              {createResult.message ? (
                <p className={successMessageClassName}>{createResult.message}</p>
              ) : null}
              {shareUrl ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                  <p className="font-semibold text-slate-950">Shareable link</p>
                  <p className="mt-2 break-all">{shareUrl}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a href={shareUrl} target="_blank" rel="noreferrer" className={secondaryButtonClassName}>
                      Open public form
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Forms list
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            Shareable forms
          </h2>
          <div className="mt-4">
            <FilterToolbar>
              <FilterToolbarItem className="min-w-[16rem] flex-[1.4]">
                <FilterToolbarSearch
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, description, or audience"
                />
              </FilterToolbarItem>
              <FilterToolbarItem>
                <FilterToolbarSelect
                  value={audienceFilter}
                  onChange={(event) => setAudienceFilter(event.target.value)}
                >
                <option value="All audiences">All audiences</option>
                {audienceOptions.map((audience) => (
                  <option key={audience} value={audience}>
                    {audience}
                  </option>
                ))}
                </FilterToolbarSelect>
              </FilterToolbarItem>
              <FilterToolbarItem>
                <FilterToolbarSelect
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as "title" | "responsesHigh" | "audience")}
                >
                <option value="title">Sort: Title</option>
                <option value="responsesHigh">Sort: Most responses</option>
                <option value="audience">Sort: Audience</option>
                </FilterToolbarSelect>
              </FilterToolbarItem>
              <FilterToolbarAction href={filteredExportUrl}>Export current view</FilterToolbarAction>
            </FilterToolbar>
          </div>
          <div className="mt-5 grid gap-3">
            {filteredForms.map((form) => (
              <button
                key={form.id}
                type="button"
                onClick={() => setSelectedFormId(form.id)}
                className={`rounded-[1.5rem] border p-4 text-left ${
                  selectedForm?.id === form.id
                    ? "border-orange-300 bg-gradient-to-br from-orange-50 to-white shadow-[0_14px_36px_rgba(249,115,22,0.10)]"
                    : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{form.title}</p>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {form.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{form.description}</p>
                <p className="mt-3 text-sm text-slate-500">{form.audience}</p>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-3">
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        loadFormIntoBuilder(form);
                      }}
                      className={secondaryButtonClassName}
                    >
                      Edit form
                    </span>
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        void deleteForm(form);
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                    >
                      {isDeletingFormId === form.id ? "Deleting..." : "Delete form"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {filteredForms.length === 0 ? (
              <div className={emptyStateClassName}>
                No forms match the current filters.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className={panelClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Form preview
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-serif text-2xl text-slate-950">{selectedForm?.title}</h2>
              <p className="mt-2 text-slate-600">{selectedForm?.description}</p>
            </div>
            {selectedForm ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => loadFormIntoBuilder(selectedForm)}
                  className={secondaryButtonClassName}
                >
                  Edit selected form
                </button>
                <button
                  type="button"
                  onClick={() => void deleteForm(selectedForm)}
                  disabled={isDeletingFormId === selectedForm.id}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingFormId === selectedForm.id ? "Deleting..." : "Delete selected form"}
                </button>
                <Link href={`/forms/${selectedForm.slug}`} className={primaryButtonClassName}>
                  Open public form
                </Link>
                <a
                  href={selectedFormShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={secondaryButtonClassName}
                >
                  Open shareable link
                </a>
              </div>
            ) : null}
          </div>
          {selectedFormShareUrl ? (
            <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
              <p className="font-semibold text-slate-950">Public form link</p>
              <p className="mt-2 break-all">{selectedFormShareUrl}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                Existing forms can be edited any time from this preview or from the forms list.
              </p>
            </div>
          ) : null}
          <div className="mt-5 grid gap-3">
            {selectedForm?.fields.map((field) => (
              <div key={field.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{field.label}</p>
                  <span className="text-sm text-slate-500">{field.type}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {field.required ? "Required field" : "Optional field"}
                </p>
                {field.options?.length ? (
                  <p className="mt-2 text-sm text-orange-700">
                    Options: {field.options.join(", ")}
                  </p>
                ) : null}
                {field.type === "linear_scale" ? (
                  <p className="mt-2 text-sm text-sky-700">
                    Scale: {field.scaleMin ?? 1} to {field.scaleMax ?? 5}
                    {" · "}
                    {field.scaleLowLabel || "Low"} to {field.scaleHighLabel || "High"}
                  </p>
                ) : null}
                {field.type === "file_upload" ? (
                  <p className="mt-2 text-sm text-sky-700">
                    Public responders can upload one file for this question.
                  </p>
                ) : null}
                {field.condition ? (
                  <p className="mt-2 text-sm text-sky-700">
                    Shows only when `{field.condition.fieldId}` = &quot;{field.condition.equals}
                    &quot;
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Responses
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            Submitted information
          </h2>
          <p className="mt-2 text-slate-600">
            {selectedResponses.length} response(s) collected for this form.
          </p>
          <div className="mt-5 space-y-4">
            {selectedResponses.map((response) => (
              <div key={response.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <p className="text-sm text-slate-500">{response.submittedAt}</p>
                <div className="mt-3 grid gap-3">
                  {Object.entries(response.answers).map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{key}</p>
                      <p className="mt-1 text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
