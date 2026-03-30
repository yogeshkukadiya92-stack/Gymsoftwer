"use client";

import { useMemo, useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [difficultyFilter, setDifficultyFilter] = useState<Exercise["difficulty"] | "All difficulties">(
    "All difficulties",
  );
  const [mediaTypeFilter, setMediaTypeFilter] = useState<Exercise["mediaType"] | "All media">(
    "All media",
  );
  const [sortBy, setSortBy] = useState<"name" | "category" | "difficulty" | "muscle">("name");
  const [formState, setFormState] = useState(emptyForm);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categories = useMemo(
    () => Array.from(new Set(exercises.map((exercise) => exercise.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [exercises],
  );
  const filteredExercises = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return [...exercises]
      .filter((exercise) => {
        const matchesSearch =
          !normalized ||
          [
            exercise.name,
            exercise.category,
            exercise.primaryMuscle,
            exercise.equipment,
            exercise.cues.join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesCategory = categoryFilter === "All categories" || exercise.category === categoryFilter;
        const matchesDifficulty =
          difficultyFilter === "All difficulties" || exercise.difficulty === difficultyFilter;
        const matchesMedia = mediaTypeFilter === "All media" || exercise.mediaType === mediaTypeFilter;

        return matchesSearch && matchesCategory && matchesDifficulty && matchesMedia;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "category":
            return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
          case "difficulty":
            return a.difficulty.localeCompare(b.difficulty) || a.name.localeCompare(b.name);
          case "muscle":
            return a.primaryMuscle.localeCompare(b.primaryMuscle) || a.name.localeCompare(b.name);
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [categoryFilter, difficultyFilter, exercises, mediaTypeFilter, searchQuery, sortBy]);
  const filteredExportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    if (categoryFilter !== "All categories") {
      params.set("category", categoryFilter);
    }

    if (difficultyFilter !== "All difficulties") {
      params.set("difficulty", difficultyFilter);
    }

    if (mediaTypeFilter !== "All media") {
      params.set("mediaType", mediaTypeFilter);
    }

    params.set("sort", sortBy);

    return `/api/admin/exercises/export?${params.toString()}`;
  }, [categoryFilter, difficultyFilter, mediaTypeFilter, searchQuery, sortBy]);

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
      <div className="space-y-6">
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

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <div className="grid gap-3 lg:grid-cols-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by exercise, muscle, category, equipment, or cue"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="All categories">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={(event) =>
                setDifficultyFilter(event.target.value as Exercise["difficulty"] | "All difficulties")
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="All difficulties">All difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select
              value={mediaTypeFilter}
              onChange={(event) =>
                setMediaTypeFilter(event.target.value as Exercise["mediaType"] | "All media")
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="All media">All media</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "name" | "category" | "difficulty" | "muscle")
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="name">Sort: Name</option>
              <option value="category">Sort: Category</option>
              <option value="difficulty">Sort: Difficulty</option>
              <option value="muscle">Sort: Primary muscle</option>
            </select>
            <button
              type="button"
              onClick={() => {
                window.location.href = filteredExportUrl;
              }}
              className="rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700"
            >
              Export current view
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredExercises.map((exercise) => (
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
        {filteredExercises.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
            No exercises match the current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
