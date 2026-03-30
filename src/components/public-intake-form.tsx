"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { IntakeForm, IntakeFormField } from "@/lib/forms";
import { fieldClassName, primaryButtonClassName, textareaClassName } from "@/components/filter-toolbar";

type PublicIntakeFormProps = {
  form: IntakeForm;
};

export function PublicIntakeForm({ form }: PublicIntakeFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  function setAnswer(fieldId: string, value: string) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  function isFieldVisible(field: IntakeFormField) {
    if (!field.condition) {
      return true;
    }

    const parentAnswer = answers[field.condition.fieldId] ?? "";
    const selectedValues = parentAnswer
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return selectedValues.includes(field.condition.equals) || parentAnswer === field.condition.equals;
  }

  function toggleCheckboxValue(fieldId: string, option: string) {
    const currentValues = (answers[fieldId] ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const nextValues = currentValues.includes(option)
      ? currentValues.filter((item) => item !== option)
      : [...currentValues, option];

    setAnswer(fieldId, nextValues.join(", "));
  }

  function renderField(field: IntakeFormField) {
    switch (field.type) {
      case "paragraph":
        return (
          <textarea
            className={textareaClassName}
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
      case "dropdown":
        return (
          <select
            className={fieldClassName}
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          >
            <option value="">Select option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "multi_select":
        return (
          <select
            multiple
            className={`${fieldClassName} min-h-36`}
            required={field.required}
            value={(answers[field.id] ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)}
            onChange={(event) =>
              setAnswer(
                field.id,
                Array.from(event.target.selectedOptions)
                  .map((option) => option.value)
                  .join(", "),
              )
            }
          >
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "multiple_choice":
        return (
          <div className="grid gap-3">
            {field.options?.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={(answers[field.id] ?? "") === option}
                  onChange={(event) => setAnswer(field.id, event.target.value)}
                  required={field.required}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="grid gap-3">
            {field.options?.map((option) => {
              const selectedValues = (answers[field.id] ?? "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

              return (
                <label
                  key={option}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={selectedValues.includes(option)}
                    onChange={() => toggleCheckboxValue(field.id, option)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        );
      case "email":
        return (
          <input
            className={fieldClassName}
            type="email"
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
      case "number":
        return (
          <input
            className={fieldClassName}
            type="number"
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
      case "link":
        return (
          <input
            className={fieldClassName}
            type="url"
            required={field.required}
            placeholder="https://"
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
      case "date":
        return (
          <input
            className={fieldClassName}
            type="date"
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
      case "time":
        return (
          <input
            className={fieldClassName}
            type="time"
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
      case "phone":
        return (
          <input
            className={fieldClassName}
            type="tel"
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
      case "short_text":
      default:
        return (
          <input
            className={fieldClassName}
            type="text"
            required={field.required}
            value={answers[field.id] ?? ""}
            onChange={(event) => setAnswer(field.id, event.target.value)}
          />
        );
    }
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    const response = await fetch(`/api/forms/${form.slug}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setSubmitError(payload.error ?? "Form submission failed.");
      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(240,127,45,0.18),_transparent_28%),linear-gradient(180deg,_#08131f_0%,_#102235_45%,_#f6efe4_45%,_#f6efe4_100%)] px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-[0_30px_120px_rgba(7,24,39,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Information form
        </p>
        <h1 className="mt-3 font-serif text-4xl text-slate-950">{form.title}</h1>
        <p className="mt-4 text-slate-600">{form.description}</p>

        {submitted ? (
          <div className="mt-8 rounded-[1.5rem] bg-emerald-50 p-6 text-emerald-800">
            <p className="text-lg font-semibold">Form submitted</p>
            <p className="mt-2">
              Your response has been saved and will appear on the admin form responses page.
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={submitForm}>
            {form.fields
              .filter(isFieldVisible)
              .map((field) => (
                <label key={field.id} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-800">
                    {field.label} {field.required ? "*" : ""}
                  </span>
                  {renderField(field)}
                  {field.type === "multi_select" ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Hold Ctrl or Cmd to select multiple options.
                    </p>
                  ) : null}
                </label>
              ))}
            {submitError ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
                {submitError}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClassName}
            >
              {isSubmitting ? "Submitting..." : "Submit form"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
