"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Profile, ProgressCheckIn, ProgressPhoto } from "@/lib/types";

type AdminProgressWorkspaceProps = {
  members: Profile[];
  initialCheckIns: ProgressCheckIn[];
  initialPhotos: ProgressPhoto[];
};

type ProgressFormState = {
  id?: string;
  memberId: string;
  recordedOn: string;
  weightKg: string;
  waistCm: string;
  hipsCm: string;
  chestCm: string;
  thighCm: string;
  energyLevel: "Low" | "Medium" | "High";
  coachNote: string;
};

type PhotoFormState = {
  memberId: string;
  recordedOn: string;
  label: string;
  note: string;
  file: File | null;
};

function buildInitialProgressForm(memberId: string): ProgressFormState {
  return {
    memberId,
    recordedOn: new Date().toISOString().slice(0, 10),
    weightKg: "",
    waistCm: "",
    hipsCm: "",
    chestCm: "",
    thighCm: "",
    energyLevel: "Medium",
    coachNote: "",
  };
}

function buildInitialPhotoForm(memberId: string): PhotoFormState {
  return {
    memberId,
    recordedOn: new Date().toISOString().slice(0, 10),
    label: "",
    note: "",
    file: null,
  };
}

export function AdminProgressWorkspace({
  members,
  initialCheckIns,
  initialPhotos,
}: AdminProgressWorkspaceProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [checkIns, setCheckIns] = useState(initialCheckIns);
  const [photos, setPhotos] = useState(initialPhotos);
  const [progressForm, setProgressForm] = useState<ProgressFormState>(
    buildInitialProgressForm(members[0]?.id ?? ""),
  );
  const [photoForm, setPhotoForm] = useState<PhotoFormState>(
    buildInitialPhotoForm(members[0]?.id ?? ""),
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [photoStatusMessage, setPhotoStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;

  const memberCheckIns = useMemo(
    () =>
      checkIns
        .filter((entry) => entry.memberId === selectedMemberId)
        .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn)),
    [checkIns, selectedMemberId],
  );

  const memberPhotos = useMemo(
    () =>
      photos
        .filter((entry) => entry.memberId === selectedMemberId)
        .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn)),
    [photos, selectedMemberId],
  );

  function resetProgressForm(memberId: string) {
    setProgressForm(buildInitialProgressForm(memberId));
  }

  function resetPhotoForm(memberId: string) {
    setPhotoForm(buildInitialPhotoForm(memberId));
  }

  async function handleProgressSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("");

    const method = progressForm.id ? "PUT" : "POST";
    const response = await fetch("/api/admin/progress", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...progressForm,
        memberId: selectedMemberId,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      entry?: ProgressCheckIn;
    };

    if (!response.ok || !payload.entry) {
      setStatusMessage(payload.error ?? "Progress save failed.");
      setIsSaving(false);
      return;
    }

    const savedEntry = payload.entry;

    setCheckIns((current) => {
      if (progressForm.id) {
        return current.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry));
      }

      return [savedEntry, ...current];
    });
    setStatusMessage(payload.message ?? "Progress saved.");
    resetProgressForm(selectedMemberId);
    setIsSaving(false);
  }

  function handleEdit(entry: ProgressCheckIn) {
    setProgressForm({
      id: entry.id,
      memberId: entry.memberId,
      recordedOn: entry.recordedOn,
      weightKg: String(entry.weightKg),
      waistCm: String(entry.waistCm),
      hipsCm: String(entry.hipsCm),
      chestCm: String(entry.chestCm),
      thighCm: String(entry.thighCm),
      energyLevel: entry.energyLevel,
      coachNote: entry.coachNote,
    });
    setStatusMessage(`Editing entry from ${entry.recordedOn}`);
  }

  async function handlePhotoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!photoForm.file) {
      setPhotoStatusMessage("Please choose an image file first.");
      return;
    }

    setIsUploading(true);
    setPhotoStatusMessage("");

    const formData = new FormData();
    formData.append("memberId", selectedMemberId);
    formData.append("recordedOn", photoForm.recordedOn);
    formData.append("label", photoForm.label);
    formData.append("note", photoForm.note);
    formData.append("file", photoForm.file);

    const response = await fetch("/api/admin/progress/photos", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      photo?: ProgressPhoto;
    };

    if (!response.ok || !payload.photo) {
      setPhotoStatusMessage(payload.error ?? "Photo upload failed.");
      setIsUploading(false);
      return;
    }

    const savedPhoto = payload.photo;

    setPhotos((current) => [savedPhoto, ...current]);
    setPhotoStatusMessage(payload.message ?? "Photo uploaded.");
    resetPhotoForm(selectedMemberId);
    setIsUploading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <label className="text-sm font-medium text-slate-700">Select member</label>
          <select
            value={selectedMemberId}
            onChange={(event) => {
              const nextMemberId = event.target.value;
              setSelectedMemberId(nextMemberId);
              resetProgressForm(nextMemberId);
              resetPhotoForm(nextMemberId);
              setStatusMessage("");
              setPhotoStatusMessage("");
            }}
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
          {selectedMember ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">{selectedMember.fullName}</p>
              <p className="mt-1">{selectedMember.fitnessGoal}</p>
              <p className="mt-1">{selectedMember.phone}</p>
              <div className="mt-4">
                <Link
                  href={`/admin/progress/report/${selectedMember.id}`}
                  target="_blank"
                  className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Open PDF report
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleProgressSubmit}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl text-slate-950">
              {progressForm.id ? "Edit check-in" : "Add check-in"}
            </h3>
            {progressForm.id ? (
              <button
                type="button"
                onClick={() => resetProgressForm(selectedMemberId)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              value={progressForm.recordedOn}
              onChange={(event) =>
                setProgressForm((current) => ({
                  ...current,
                  recordedOn: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <select
              value={progressForm.energyLevel}
              onChange={(event) =>
                setProgressForm((current) => ({
                  ...current,
                  energyLevel: event.target.value as "Low" | "Medium" | "High",
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            >
              <option value="Low">Low energy</option>
              <option value="Medium">Medium energy</option>
              <option value="High">High energy</option>
            </select>
            <input
              type="number"
              step="0.1"
              placeholder="Weight (kg)"
              value={progressForm.weightKg}
              onChange={(event) =>
                setProgressForm((current) => ({
                  ...current,
                  weightKg: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Waist (cm)"
              value={progressForm.waistCm}
              onChange={(event) =>
                setProgressForm((current) => ({
                  ...current,
                  waistCm: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Hips (cm)"
              value={progressForm.hipsCm}
              onChange={(event) =>
                setProgressForm((current) => ({
                  ...current,
                  hipsCm: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Chest (cm)"
              value={progressForm.chestCm}
              onChange={(event) =>
                setProgressForm((current) => ({
                  ...current,
                  chestCm: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Thigh (cm)"
              value={progressForm.thighCm}
              onChange={(event) =>
                setProgressForm((current) => ({
                  ...current,
                  thighCm: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 sm:col-span-2"
            />
          </div>

          <textarea
            placeholder="Trainer notes"
            value={progressForm.coachNote}
            onChange={(event) =>
              setProgressForm((current) => ({
                ...current,
                coachNote: event.target.value,
              }))
            }
            className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{statusMessage}</p>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : progressForm.id ? "Save changes" : "Add progress"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handlePhotoSubmit}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <h3 className="font-serif text-2xl text-slate-950">Upload progress photo</h3>
          <div className="mt-4 grid gap-4">
            <input
              type="date"
              value={photoForm.recordedOn}
              onChange={(event) =>
                setPhotoForm((current) => ({
                  ...current,
                  recordedOn: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <input
              type="text"
              placeholder="Photo label"
              value={photoForm.label}
              onChange={(event) =>
                setPhotoForm((current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <textarea
              placeholder="Photo note"
              value={photoForm.note}
              onChange={(event) =>
                setPhotoForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
              className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setPhotoForm((current) => ({
                  ...current,
                  file: event.target.files?.[0] ?? null,
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800"
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{photoStatusMessage}</p>
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Upload photo"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Saved check-ins</h3>
          <div className="mt-4 space-y-3">
            {memberCheckIns.map((entry) => (
              <div key={entry.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{entry.recordedOn}</p>
                    <p className="text-sm text-slate-600">
                      {entry.weightKg} kg • Waist {entry.waistCm} cm • Energy {entry.energyLevel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                  >
                    Edit
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-600">{entry.coachNote}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Uploaded photos</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {memberPhotos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-[1.25rem] border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.label}
                  className="h-44 w-full object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{photo.label}</p>
                    <p className="text-sm text-slate-500">{photo.recordedOn}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{photo.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
