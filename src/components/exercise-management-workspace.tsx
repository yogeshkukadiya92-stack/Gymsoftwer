"use client";

import { useState } from "react";

import { Exercise } from "@/lib/types";

type ExerciseManagementWorkspaceProps = {
  initialExercises: Exercise[];
};

const emptyForm = {
  id: "",
  name: "",
  category: "",
  difficulty: "Beginner" as Exercise["difficulty"],
  primaryMuscle: "",
  equipment: "",
  mediaType: "video" as Exercise["mediaType"],
  mediaUrl: "",
  cues: "",
};

export function ExerciseManagementWorkspace({
  initialExercises,
}: ExerciseManagementWorkspaceProps) {
  const [exercises, setExercises] = useState(initialExercises);
  const [formState, setFormState] = useState(emptyForm);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setFormState(emptyForm);
  }

  function handleEdit(exercise: Exercise) {
    setFormState({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      difficulty: exercise.difficulty,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      mediaType: exercise.mediaType,
      mediaUrl: exercise.mediaUrl,
      cues: exercise.cues.join(", "),
    });
    setStatusMessage(`Editing ${exercise.name}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/exercises", {
      method: formState.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formState,
        cues: formState.cues
          .split(",")
          .map((cue) => cue.trim())
          .filter(Boolean),
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      exercise?: Exercise;
    };

    if (!response.ok || !payload.exercise) {
      setStatusMessage(payload.error ?? "Exercise save failed.");
      setIsSubmitting(false);
      return;
    }

    setExercises((current) =>
      formState.id
        ? current.map((item) => (item.id === payload.exercise?.id ? payload.exercise! : item))
        : [payload.exercise!, ...current],
    );
    setStatusMessage(payload.message ?? (formState.id ? "Exercise updated." : "Exercise created."));
    resetForm();
    setIsSubmitting(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-2xl text-slate-950">
            {formState.id ? "Edit exercise" : "Add exercise"}
          </h3>
          {formState.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Exercise name"
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Category"
            value={formState.category}
            onChange={(event) =>
              setFormState((current) => ({ ...current, category: event.target.value }))
            }
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={formState.difficulty}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                difficulty: event.target.value as Exercise["difficulty"],
              }))
            }
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Primary muscle"
            value={formState.primaryMuscle}
            onChange={(event) =>
              setFormState((current) => ({ ...current, primaryMuscle: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Equipment"
            value={formState.equipment}
            onChange={(event) =>
              setFormState((current) => ({ ...current, equipment: event.target.value }))
            }
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={formState.mediaType}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                mediaType: event.target.value as Exercise["mediaType"],
              }))
            }
          >
            <option value="video">Video</option>
            <option value="image">Image</option>
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Google Drive, YouTube, or media link"
            value={formState.mediaUrl}
            onChange={(event) =>
              setFormState((current) => ({ ...current, mediaUrl: event.target.value }))
            }
          />
          <textarea
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            rows={4}
            placeholder="Coaching cues separated by commas"
            value={formState.cues}
            onChange={(event) => setFormState((current) => ({ ...current, cues: event.target.value }))}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{statusMessage}</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          >
            {isSubmitting ? "Saving..." : formState.id ? "Save exercise" : "Create exercise"}
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                  {exercise.category} · {exercise.difficulty}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-slate-950">{exercise.name}</h2>
                <p className="mt-2 text-slate-600">
                  {exercise.primaryMuscle} · {exercise.equipment}
                </p>
                <p className="mt-2 text-sm text-slate-500">{exercise.mediaType} link saved</p>
              </div>
              <button
                type="button"
                onClick={() => handleEdit(exercise)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Edit exercise
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {exercise.cues.map((cue) => (
                <span key={cue} className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700">
                  {cue}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
