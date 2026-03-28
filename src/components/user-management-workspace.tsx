"use client";

import { useState } from "react";

import { Profile } from "@/lib/types";

type UserManagementWorkspaceProps = {
  initialUsers: Profile[];
};

export function UserManagementWorkspace({
  initialUsers,
}: UserManagementWorkspaceProps) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    id: "",
    currentEmail: "",
    fullName: "",
    email: "",
    password: "",
    role: "member" as "member" | "trainer" | "admin",
    phone: "",
    fitnessGoal: "",
    branch: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function resetForm() {
    setEditingUserId(null);
    setFormState({
      id: "",
      currentEmail: "",
      fullName: "",
      email: "",
      password: "",
      role: "member",
      phone: "",
      fitnessGoal: "",
      branch: "",
    });
  }

  async function refreshUsers() {
    const response = await fetch("/api/admin/users");
    const payload = (await response.json()) as { users?: Profile[]; error?: string };

    if (!response.ok || !payload.users) {
      setStatusMessage(payload.error ?? "Users refresh failed.");
      return;
    }

    setUsers(payload.users);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/users", {
      method: editingUserId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      user?: { id: string };
    };

    if (!response.ok || !payload.user) {
      setStatusMessage(payload.error ?? "User save failed.");
      setIsSubmitting(false);
      return;
    }

    const nextUser: Profile = {
      id: payload.user.id,
      fullName: formState.fullName,
      email: formState.email,
      phone: formState.phone,
      role: formState.role,
      fitnessGoal: formState.fitnessGoal,
      branch: formState.branch,
      joinedOn:
        users.find((user) => user.id === payload.user?.id)?.joinedOn ??
        new Date().toISOString().slice(0, 10),
    };

    setUsers((current) =>
      editingUserId
        ? current.map((user) => (user.id === payload.user?.id ? nextUser : user))
        : [nextUser, ...current],
    );
    resetForm();
    setStatusMessage(payload.message ?? (editingUserId ? "User updated." : "User created."));
    setIsSubmitting(false);
  }

  function handleEdit(user: Profile) {
    setEditingUserId(user.id);
    setFormState({
      id: user.id,
      currentEmail: user.email,
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone,
      fitnessGoal: user.fitnessGoal,
      branch: user.branch,
    });
    setStatusMessage(`Editing ${user.fullName}`);
  }

  async function handleDelete(user: Profile) {
    setIsDeleting(user.id);
    setStatusMessage("");

    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: user.id, email: user.email }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "User delete failed.");
      setIsDeleting(null);
      return;
    }

    setUsers((current) => current.filter((item) => item.id !== user.id));
    if (editingUserId === user.id) {
      resetForm();
    }
    setStatusMessage(payload.message ?? "User deleted.");
    setIsDeleting(null);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);
    setStatusMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/users/import", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      saved?: { imported: number; updated: number };
      duplicateEmails?: string[];
    };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Users import failed.");
      setIsImporting(false);
      event.target.value = "";
      return;
    }

    await refreshUsers();
    setStatusMessage(
      `${payload.message ?? "Users imported."} Imported: ${payload.saved?.imported ?? 0}, updated: ${payload.saved?.updated ?? 0}${
        payload.duplicateEmails?.length
          ? `, duplicate emails in file: ${payload.duplicateEmails.join(", ")}`
          : ""
      }`,
    );
    setIsImporting(false);
    event.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl text-slate-950">Bulk user tools</h3>
            <p className="mt-2 text-sm text-slate-500">
              Excel thi multiple admin, trainer, ane member users add, update, export, ane sample file download kari shako.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/admin/users/export"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
            >
              Export users Excel
            </a>
            <a
              href="/api/admin/users/template"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
            >
              Download sample file
            </a>
            <label className="cursor-pointer rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
              {isImporting ? "Importing..." : "Import users Excel"}
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl text-slate-950">
              {editingUserId ? "Edit user" : "Create user"}
            </h3>
            {editingUserId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
              >
                Cancel
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Full name"
              value={formState.fullName}
              onChange={(event) =>
                setFormState((current) => ({ ...current, fullName: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Email"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({ ...current, email: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Temporary password"
              type="password"
              value={formState.password}
              onChange={(event) =>
                setFormState((current) => ({ ...current, password: event.target.value }))
              }
            />
            <select
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={formState.role}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  role: event.target.value as "member" | "trainer" | "admin",
                }))
              }
            >
              <option value="member">Member</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Phone"
              value={formState.phone}
              onChange={(event) =>
                setFormState((current) => ({ ...current, phone: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Fitness goal"
              value={formState.fitnessGoal}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  fitnessGoal: event.target.value,
                }))
              }
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Branch"
              value={formState.branch}
              onChange={(event) =>
                setFormState((current) => ({ ...current, branch: event.target.value }))
              }
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{statusMessage}</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
            >
              {isSubmitting ? "Saving..." : editingUserId ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <h3 className="font-serif text-2xl text-slate-950">Existing users</h3>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{user.fullName}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {user.role}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {user.branch || "No branch"} • {user.phone || "No phone"}
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user)}
                    disabled={isDeleting === user.id}
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
                  >
                    {isDeleting === user.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
