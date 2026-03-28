"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { IntakeForm, IntakeFormField } from "@/lib/forms";

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
              Tamaro data save thai gayo chhe ane admin side na form responses page ma dekhashe.
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
                  {field.type === "paragraph" ? (
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3"
                      required={field.required}
                      value={answers[field.id] ?? ""}
                      onChange={(event) => setAnswer(field.id, event.target.value)}
                    />
                  ) : field.type === "dropdown" ? (
                    <select
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3"
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
                  ) : field.type === "multiple_choice" ? (
                    <div className="grid gap-3">
                      {field.options?.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3"
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
                  ) : field.type === "checkbox" ? (
                    <div className="grid gap-3">
                      {field.options?.map((option) => {
                        const selectedValues = (answers[field.id] ?? "")
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean);

                        return (
                          <label
                            key={option}
                            className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3"
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
                  ) : (
                    <input
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      type={field.type === "email" ? "email" : "text"}
                      required={field.required}
                      value={answers[field.id] ?? ""}
                      onChange={(event) => setAnswer(field.id, event.target.value)}
                    />
                  )}
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
              className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-slate-950"
            >
              {isSubmitting ? "Submitting..." : "Submit form"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
