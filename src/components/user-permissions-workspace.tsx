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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Profile["role"] | "All roles">("All roles");
  const [accessFilter, setAccessFilter] = useState<
    "All access" | "With custom access label" | "Without custom access label"
  >("All access");
  const [sortBy, setSortBy] = useState<"name" | "role" | "access" | "branch">("name");
  const [permissions, setPermissions] = useState(initialPermissions);
  const [selectedUserId, setSelectedUserId] = useState(managedUsers[0]?.id ?? "");
  const [accessLabel, setAccessLabel] = useState(
    initialPermissions.find((item) => item.userId === managedUsers[0]?.id)?.accessLabel ?? "",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return [...managedUsers]
      .filter((user) => {
        const permission = permissions.find((item) => item.userId === user.id);
        const accessLabel = permission?.accessLabel ?? "";
        const matchesSearch =
          !normalized ||
          [user.fullName, user.email, user.phone, user.branch, accessLabel]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesRole = roleFilter === "All roles" || user.role === roleFilter;
        const matchesAccess =
          accessFilter === "All access" ||
          (accessFilter === "With custom access label"
            ? Boolean(accessLabel.trim())
            : !accessLabel.trim());

        return matchesSearch && matchesRole && matchesAccess;
      })
      .sort((a, b) => {
        const permissionA = permissions.find((item) => item.userId === a.id);
        const permissionB = permissions.find((item) => item.userId === b.id);

        switch (sortBy) {
          case "role":
            return a.role.localeCompare(b.role) || a.fullName.localeCompare(b.fullName);
          case "access":
            return (
              (permissionA?.accessLabel ?? "").localeCompare(permissionB?.accessLabel ?? "") ||
              a.fullName.localeCompare(b.fullName)
            );
          case "branch":
            return a.branch.localeCompare(b.branch) || a.fullName.localeCompare(b.fullName);
          case "name":
          default:
            return a.fullName.localeCompare(b.fullName);
        }
      });
  }, [accessFilter, managedUsers, permissions, roleFilter, searchQuery, sortBy]);

  const selectedUser =
    filteredUsers.find((user) => user.id === selectedUserId) ??
    managedUsers.find((user) => user.id === selectedUserId) ??
    filteredUsers[0] ??
    managedUsers[0];
  const options = selectedUser ? getPermissionOptionsForRole(selectedUser.role) : [];
  const rolePresets = selectedUser
    ? permissionPresets.filter((preset) => preset.role === selectedUser.role)
    : [];
  const selectedPermission = permissions.find((item) => item.userId === selectedUser?.id);
  const allowedRoutes = selectedPermission?.allowedRoutes ?? options.map((item) => item.href);
  const filteredExportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    if (roleFilter !== "All roles") {
      params.set("role", roleFilter);
    }

    if (accessFilter !== "All access") {
      params.set("access", accessFilter);
    }

    params.set("sort", sortBy);

    return `/api/admin/user-permissions/export?${params.toString()}`;
  }, [accessFilter, roleFilter, searchQuery, sortBy]);

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
        accessLabel,
        allowedRoutes: nextRoutes,
      };

      return existing
        ? current.map((item) => (item.userId === selectedUser.id ? nextPermission : item))
        : [nextPermission, ...current];
    });
  }

  function applyPreset(label: string, allowedPresetRoutes: string[]) {
    if (!selectedUser) {
      return;
    }

    setPermissions((current) => {
      const nextPermission = {
        userId: selectedUser.id,
        accessLabel: label,
        allowedRoutes: allowedPresetRoutes,
      };

      const existing = current.find((item) => item.userId === selectedUser.id);

      return existing
        ? current.map((item) => (item.userId === selectedUser.id ? nextPermission : item))
        : [nextPermission, ...current];
    });

    setAccessLabel(label);
    setStatusMessage("Preset applied. Click save permissions to confirm.");
  }

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);
    const permission = permissions.find((item) => item.userId === userId);
    setAccessLabel(permission?.accessLabel ?? "");
    setStatusMessage("");
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
        accessLabel,
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
        <div className="mt-4 grid gap-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, email, phone, branch, or access label"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as Profile["role"] | "All roles")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="All roles">All roles</option>
              <option value="admin">Admin</option>
              <option value="trainer">Trainer</option>
              <option value="member">Member</option>
            </select>
            <select
              value={accessFilter}
              onChange={(event) =>
                setAccessFilter(
                  event.target.value as
                    | "All access"
                    | "With custom access label"
                    | "Without custom access label",
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="All access">All access</option>
              <option value="With custom access label">With custom access label</option>
              <option value="Without custom access label">Without custom access label</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "name" | "role" | "access" | "branch")
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="name">Sort: Name</option>
              <option value="role">Sort: Role</option>
              <option value="access">Sort: Access label</option>
              <option value="branch">Sort: Branch</option>
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
        <div className="mt-4 space-y-3">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user.id)}
              className={`block w-full rounded-[1.25rem] border p-4 text-left transition ${
                selectedUserId === user.id
                  ? "border-orange-200 bg-orange-50"
                  : "border-slate-200 bg-slate-50 hover:border-orange-200"
              }`}
            >
              <p className="font-semibold text-slate-950">{user.fullName}</p>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              {permissions.find((item) => item.userId === user.id)?.accessLabel ? (
                <p className="mt-2 text-sm font-medium text-orange-700">
                  {permissions.find((item) => item.userId === user.id)?.accessLabel}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {user.role}
              </p>
            </button>
          ))}
          {filteredUsers.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No users match the current permission filters.
            </div>
          ) : null}
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
                        onClick={() => applyPreset(preset.label, preset.allowedRoutes)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-950">Custom access title</p>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  placeholder="Billing staff, Reception, Online trainer"
                  value={accessLabel}
                  onChange={(event) => setAccessLabel(event.target.value)}
                />
              </label>
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
