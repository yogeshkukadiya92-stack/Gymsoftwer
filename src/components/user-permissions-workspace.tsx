"use client";

import { useMemo, useState } from "react";

import { getPermissionOptionsForRole, permissionPresets } from "@/lib/user-permissions";
import { Profile, UserPermission } from "@/lib/types";

type UserPermissionsWorkspaceProps = {
  users: Profile[];
  initialPermissions: UserPermission[];
};

export function UserPermissionsWorkspace({
  users,
  initialPermissions,
}: UserPermissionsWorkspaceProps) {
  const managedUsers = useMemo(() => users, [users]);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [selectedUserId, setSelectedUserId] = useState(managedUsers[0]?.id ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedUser = managedUsers.find((user) => user.id === selectedUserId) ?? managedUsers[0];
  const options = selectedUser ? getPermissionOptionsForRole(selectedUser.role) : [];
  const rolePresets = selectedUser
    ? permissionPresets.filter((preset) => preset.role === selectedUser.role)
    : [];
  const selectedPermission = permissions.find((item) => item.userId === selectedUser?.id);
  const allowedRoutes = selectedPermission?.allowedRoutes ?? options.map((item) => item.href);

  function toggleRoute(route: string) {
    if (!selectedUser) {
      return;
    }

    setPermissions((current) => {
      const existing = current.find((item) => item.userId === selectedUser.id);
      const nextRoutes = existing?.allowedRoutes.includes(route)
        ? existing.allowedRoutes.filter((item) => item !== route)
        : [...(existing?.allowedRoutes ?? options.map((item) => item.href)), route];

      const nextPermission = {
        userId: selectedUser.id,
        allowedRoutes: nextRoutes,
      };

      return existing
        ? current.map((item) => (item.userId === selectedUser.id ? nextPermission : item))
        : [nextPermission, ...current];
    });
  }

  function applyPreset(allowedPresetRoutes: string[]) {
    if (!selectedUser) {
      return;
    }

    setPermissions((current) => {
      const nextPermission = {
        userId: selectedUser.id,
        allowedRoutes: allowedPresetRoutes,
      };

      const existing = current.find((item) => item.userId === selectedUser.id);

      return existing
        ? current.map((item) => (item.userId === selectedUser.id ? nextPermission : item))
        : [nextPermission, ...current];
    });

    setStatusMessage("Preset applied. Click save permissions to confirm.");
  }

  async function savePermissions() {
    if (!selectedUser) {
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    const currentPermission = permissions.find((item) => item.userId === selectedUser.id);
    const response = await fetch("/api/admin/user-permissions", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: selectedUser.id,
        allowedRoutes: currentPermission?.allowedRoutes ?? options.map((item) => item.href),
      }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Permission update failed.");
      setIsSaving(false);
      return;
    }

    setStatusMessage(payload.message ?? "Permissions updated.");
    setIsSaving(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <h3 className="font-serif text-2xl text-slate-950">Users</h3>
        <p className="mt-2 text-sm text-slate-500">
          Choose a member or trainer and decide which portal pages they are allowed to open.
        </p>
        <div className="mt-4 space-y-3">
          {managedUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedUserId(user.id)}
              className={`block w-full rounded-[1.25rem] border p-4 text-left transition ${
                selectedUserId === user.id
                  ? "border-orange-200 bg-orange-50"
                  : "border-slate-200 bg-slate-50 hover:border-orange-200"
              }`}
            >
              <p className="font-semibold text-slate-950">{user.fullName}</p>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {user.role}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        {selectedUser ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl text-slate-950">{selectedUser.fullName}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Control what this {selectedUser.role} can see inside their portal.
                </p>
              </div>
              <button
                type="button"
                onClick={savePermissions}
                disabled={isSaving}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
              >
                {isSaving ? "Saving..." : "Save permissions"}
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {rolePresets.length > 0 ? (
                <div className="mb-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                    Quick presets
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rolePresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.allowedRoutes)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {options.map((option) => {
                const checked = allowedRoutes.includes(option.href);

                return (
                  <label
                    key={option.href}
                    className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-950">{option.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{option.href}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRoute(option.href)}
                      className="h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                  </label>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-slate-500">{statusMessage}</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">No users available for permission management yet.</p>
        )}
      </div>
    </div>
  );
}
