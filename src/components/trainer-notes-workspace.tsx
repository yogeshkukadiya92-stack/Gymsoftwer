"use client";

import { useState } from "react";

import { TrainerClientNote } from "@/lib/business-data";
import { Profile } from "@/lib/types";

type TrainerNotesWorkspaceProps = {
  members: Profile[];
  notes: TrainerClientNote[];
};

const emptyForm = {
  id: "",
  memberId: "",
  trainerName: "",
  note: "",
  focusArea: "",
  updatedOn: new Date().toISOString().slice(0, 10),
};

export function TrainerNotesWorkspace({
  members,
  notes: initialNotes,
}: TrainerNotesWorkspaceProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [formState, setFormState] = useState(emptyForm);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const selectedMember = members.find((member) => member.id === formState.memberId);

  function resetForm() {
    setFormState(emptyForm);
  }

  function handleEdit(note: TrainerClientNote) {
    setFormState({
      id: note.id,
      memberId: note.memberId,
      trainerName: note.trainerName,
      note: note.note,
      focusArea: note.focusArea,
      updatedOn: note.updatedOn,
    });
    setStatusMessage(`Editing note for ${note.memberName}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const member = members.find((item) => item.id === formState.memberId);

    if (!member) {
      setStatusMessage("Please select a member.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/trainer/notes", {
      method: formState.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: formState.id,
        memberId: member.id,
        memberName: member.fullName,
        trainerName: formState.trainerName,
        note: formState.note,
        focusArea: formState.focusArea,
        updatedOn: formState.updatedOn,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      note?: TrainerClientNote;
    };

    if (!response.ok || !payload.note) {
      setStatusMessage(payload.error ?? "Trainer note save failed.");
      setIsSubmitting(false);
      return;
    }

    setNotes((current) =>
      formState.id
        ? current.map((note) => (note.id === payload.note?.id ? payload.note : note))
        : [payload.note!, ...current],
    );
    setStatusMessage(payload.message ?? (formState.id ? "Trainer note updated." : "Trainer note created."));
    resetForm();
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setIsDeleting(id);
    setStatusMessage("");

    const response = await fetch("/api/trainer/notes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Trainer note delete failed.");
      setIsDeleting(null);
      return;
    }

    setNotes((current) => current.filter((note) => note.id !== id));
    if (formState.id === id) {
      resetForm();
    }
    setStatusMessage(payload.message ?? "Trainer note deleted.");
    setIsDeleting(null);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-2xl text-slate-950">
            {formState.id ? "Edit trainer note" : "Add trainer note"}
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
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={formState.memberId}
            onChange={(event) => setFormState((current) => ({ ...current, memberId: event.target.value }))}
          >
            <option value="">Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Trainer name"
            value={formState.trainerName}
            onChange={(event) => setFormState((current) => ({ ...current, trainerName: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Focus area"
            value={formState.focusArea}
            onChange={(event) => setFormState((current) => ({ ...current, focusArea: event.target.value }))}
          />
          <input
            type="date"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={formState.updatedOn}
            onChange={(event) => setFormState((current) => ({ ...current, updatedOn: event.target.value }))}
          />
          <textarea
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:col-span-2"
            rows={4}
            placeholder="Trainer note"
            value={formState.note}
            onChange={(event) => setFormState((current) => ({ ...current, note: event.target.value }))}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {statusMessage || (selectedMember ? `Selected: ${selectedMember.fullName}` : "")}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          >
            {isSubmitting ? "Saving..." : formState.id ? "Save note" : "Create note"}
          </button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {notes.map((note) => (
          <div key={note.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{note.memberName}</p>
                <p className="mt-1 text-sm text-slate-600">{note.focusArea}</p>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                {note.trainerName || "Trainer"}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{note.note}</p>
            <p className="mt-3 text-sm text-slate-500">{note.updatedOn}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleEdit(note)}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                disabled={isDeleting === note.id}
                className="rounded-full bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                {isDeleting === note.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
