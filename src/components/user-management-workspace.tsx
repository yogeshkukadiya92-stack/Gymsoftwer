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
  const [formState, setFormState] = useState({
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/users", {
      method: "POST",
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
      setStatusMessage(payload.error ?? "User creation failed.");
      setIsSubmitting(false);
      return;
    }

    setUsers((current) => [
      {
        id: payload.user!.id,
        fullName: formState.fullName,
        email: formState.email,
        phone: formState.phone,
        role: formState.role,
        fitnessGoal: formState.fitnessGoal,
        branch: formState.branch,
        joinedOn: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);
    setFormState({
      fullName: "",
      email: "",
      password: "",
      role: "member",
      phone: "",
      fitnessGoal: "",
      branch: "",
    });
    setStatusMessage(payload.message ?? "User created.");
    setIsSubmitting(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
      >
        <h3 className="font-serif text-2xl text-slate-950">Create user</h3>
        <div className="mt-4 grid gap-4">
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Full name" value={formState.fullName} onChange={(event) => setFormState((current) => ({ ...current, fullName: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Email" type="email" value={formState.email} onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Temporary password" type="password" value={formState.password} onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))} />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={formState.role} onChange={(event) => setFormState((current) => ({ ...current, role: event.target.value as "member" | "trainer" | "admin" }))}>
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Phone" value={formState.phone} onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Fitness goal" value={formState.fitnessGoal} onChange={(event) => setFormState((current) => ({ ...current, fitnessGoal: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Branch" value={formState.branch} onChange={(event) => setFormState((current) => ({ ...current, branch: event.target.value }))} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{statusMessage}</p>
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            {isSubmitting ? "Creating..." : "Create user"}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
