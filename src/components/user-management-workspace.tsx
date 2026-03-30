"use client";

import { useMemo, useState } from "react";

import {
  emptyStateClassName,
  dangerButtonClassName,
  fieldClassName,
  mutedStatusTextClassName,
  panelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/filter-toolbar";
import { DEFAULT_FIRST_LOGIN_PASSWORD } from "@/lib/account-policy";
import { getUserBranchHistory } from "@/lib/branch-utils";
import { ManagedUserLoginStatus } from "@/lib/auth";
import { AppData, Profile, UserPermission } from "@/lib/types";

type UserManagementWorkspaceProps = {
  initialUsers: Profile[];
  initialLoginStatuses: ManagedUserLoginStatus[];
  initialUserPermissions: UserPermission[];
  gymBranches: AppData["gymBranches"];
  branchVisits: AppData["branchVisits"];
  sessions: AppData["sessions"];
  memberships: AppData["memberships"];
};

export function UserManagementWorkspace({
  initialUsers,
  initialLoginStatuses,
  initialUserPermissions,
  gymBranches,
  branchVisits,
  sessions,
  memberships,
}: UserManagementWorkspaceProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loginStatuses, setLoginStatuses] = useState(initialLoginStatuses);
  const [userPermissions, setUserPermissions] = useState(initialUserPermissions);
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0]?.id ?? "");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "member" | "trainer" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "reset" | "not-ready">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_desc" | "role" | "branch">("newest");
  const [formState, setFormState] = useState({
    id: "",
    currentEmail: "",
    fullName: "",
    email: "",
    password: DEFAULT_FIRST_LOGIN_PASSWORD,
    role: "member" as "member" | "trainer" | "admin",
    phone: "",
    fitnessGoal: "",
    branch: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const filteredUsers = useMemo(() => {
    const result = users.filter((user) => {
      const search = searchQuery.trim().toLowerCase();
      const permissionLabel = userPermissions.find((entry) => entry.userId === user.id)?.accessLabel?.toLowerCase() ?? "";
      const loginStatus = loginStatuses.find((entry) => entry.userId === user.id);

      const matchesSearch =
        !search ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone.toLowerCase().includes(search) ||
        permissionLabel.includes(search);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ready" && loginStatus?.loginReady && !loginStatus.mustResetPassword) ||
        (statusFilter === "reset" && loginStatus?.mustResetPassword) ||
        (statusFilter === "not-ready" && !loginStatus?.loginReady);

      return matchesSearch && matchesRole && matchesStatus;
    });

    switch (sortBy) {
      case "name_desc":
        result.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case "role":
        result.sort((a, b) => a.role.localeCompare(b.role) || a.fullName.localeCompare(b.fullName));
        break;
      case "branch":
        result.sort((a, b) => a.branch.localeCompare(b.branch) || a.fullName.localeCompare(b.fullName));
        break;
      case "oldest":
        result.sort((a, b) => a.joinedOn.localeCompare(b.joinedOn));
        break;
      case "newest":
      default:
        result.sort((a, b) => b.joinedOn.localeCompare(a.joinedOn));
        break;
    }

    return result;
  }, [loginStatuses, roleFilter, searchQuery, sortBy, statusFilter, userPermissions, users]);

  const filteredExportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    params.set("role", roleFilter);
    params.set("status", statusFilter);
    params.set("sort", sortBy);

    return `/api/admin/users/export?${params.toString()}`;
  }, [roleFilter, searchQuery, sortBy, statusFilter]);
  const selectedUserLoginStatus =
    loginStatuses.find((status) => status.userId === selectedUser?.id) ?? null;
  const selectedUserBranchHistory = useMemo(() => {
    if (!selectedUser) {
      return null;
    }

    return getUserBranchHistory(
      selectedUser,
      gymBranches,
      branchVisits,
      sessions,
      memberships,
    );
  }, [branchVisits, gymBranches, memberships, selectedUser, sessions]);

  function resetForm() {
    setEditingUserId(null);
    setFormState({
      id: "",
      currentEmail: "",
      fullName: "",
      email: "",
      password: DEFAULT_FIRST_LOGIN_PASSWORD,
      role: "member",
      phone: "",
      fitnessGoal: "",
      branch: "",
    });
  }

  async function refreshUsers() {
    const response = await fetch("/api/admin/users");
    const payload = (await response.json()) as {
      users?: Profile[];
      loginStatuses?: ManagedUserLoginStatus[];
      userPermissions?: UserPermission[];
      error?: string;
    };

    if (!response.ok || !payload.users) {
      setStatusMessage(payload.error ?? "Users refresh failed.");
      return;
    }

    setUsers(payload.users);
    setLoginStatuses(payload.loginStatuses ?? []);
    setUserPermissions(payload.userPermissions ?? []);
    if (!selectedUserId && payload.users.length > 0) {
      setSelectedUserId(payload.users[0].id);
    }
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
    setSelectedUserId(payload.user.id);
    resetForm();
    setStatusMessage(payload.message ?? (editingUserId ? "User updated." : "User created."));
    setIsSubmitting(false);
  }

  function handleEdit(user: Profile) {
    setEditingUserId(user.id);
    setSelectedUserId(user.id);
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

    const remainingUsers = users.filter((item) => item.id !== user.id);
    setUsers(remainingUsers);
    if (editingUserId === user.id) {
      resetForm();
    }
    if (selectedUserId === user.id) {
      setSelectedUserId(remainingUsers[0]?.id ?? "");
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
      <div className={panelClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl text-slate-950">Bulk user tools</h3>
            <p className="mt-2 text-sm text-slate-500">
              Add, update, export, and import multiple admin, trainer, and member users from Excel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={filteredExportUrl}
              className={secondaryButtonClassName}
            >
              Export filtered users Excel
            </a>
            <a
              href="/api/admin/users/template"
              className={secondaryButtonClassName}
            >
              Download sample file
            </a>
            <label className={`${primaryButtonClassName} cursor-pointer`}>
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr_0.95fr]">
        <form
          onSubmit={handleSubmit}
          className={panelClassName}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl text-slate-950">
              {editingUserId ? "Edit user" : "Create user"}
            </h3>
            {editingUserId ? (
              <button
                type="button"
                onClick={resetForm}
                className={secondaryButtonClassName}
              >
                Cancel
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4">
            {!editingUserId ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                New users can sign in with their email or phone number. Their default password is{" "}
                <span className="font-semibold">{DEFAULT_FIRST_LOGIN_PASSWORD}</span>, and they will be asked to set a new password after first login.
              </div>
            ) : null}
            <input
              className={fieldClassName}
              placeholder="Full name"
              value={formState.fullName}
              onChange={(event) =>
                setFormState((current) => ({ ...current, fullName: event.target.value }))
              }
            />
            <input
              className={fieldClassName}
              placeholder="Email"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({ ...current, email: event.target.value }))
              }
            />
            <input
              className={fieldClassName}
              placeholder={editingUserId ? "Leave blank to keep current password" : "Default password"}
              type="password"
              value={formState.password}
              onChange={(event) =>
                setFormState((current) => ({ ...current, password: event.target.value }))
              }
            />
            <select
              className={fieldClassName}
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
              className={fieldClassName}
              placeholder="Phone"
              value={formState.phone}
              onChange={(event) =>
                setFormState((current) => ({ ...current, phone: event.target.value }))
              }
            />
            <input
              className={fieldClassName}
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
              className={fieldClassName}
              placeholder="Branch"
              value={formState.branch}
              onChange={(event) =>
                setFormState((current) => ({ ...current, branch: event.target.value }))
              }
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className={mutedStatusTextClassName}>{statusMessage}</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClassName}
            >
              {isSubmitting ? "Saving..." : editingUserId ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>

        <div className={panelClassName}>
          <h3 className="font-serif text-2xl text-slate-950">Existing users</h3>
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] p-4">
            <input
              className={fieldClassName}
              placeholder="Search by name, email, phone, or access label"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className={fieldClassName}
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as "all" | "member" | "trainer" | "admin")
                }
              >
                <option value="all">All roles</option>
                <option value="member">Member</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className={fieldClassName}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | "ready" | "reset" | "not-ready")
                }
              >
                <option value="all">All login states</option>
                <option value="ready">Login ready</option>
                <option value="reset">Must reset password</option>
                <option value="not-ready">Login not ready</option>
              </select>
            </div>
            <select
              className={fieldClassName}
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as "newest" | "oldest" | "name_desc" | "role" | "branch",
                )
              }
            >
              <option value="newest">Sort by newest</option>
              <option value="oldest">Sort by oldest</option>
              <option value="name_desc">Sort by name</option>
              <option value="role">Sort by role</option>
              <option value="branch">Sort by branch</option>
            </select>
          </div>
          {filteredUsers.map((user) => (
            <button
              type="button"
              key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`block w-full rounded-[1.25rem] p-4 text-left transition ${
                  selectedUserId === user.id
                    ? "border border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-[0_16px_40px_rgba(249,115,22,0.10)]"
                    : "border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] hover:border-slate-300"
                }`}
              >
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
                  {user.branch || "No branch"} - {user.phone || "No phone"}
                </p>
                {userPermissions.find((entry) => entry.userId === user.id)?.accessLabel ? (
                  <div className="mt-2">
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                      {userPermissions.find((entry) => entry.userId === user.id)?.accessLabel}
                    </span>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(() => {
                    const status = loginStatuses.find((entry) => entry.userId === user.id);

                    if (!status?.loginReady) {
                      return (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                          Login not ready
                        </span>
                      );
                    }

                    if (status.mustResetPassword) {
                      return (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                          Must reset password
                        </span>
                      );
                    }

                    return (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Login ready
                      </span>
                    );
                  })()}
                </div>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(user);
                    }}
                    className={secondaryButtonClassName}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(user);
                    }}
                    disabled={isDeleting === user.id}
                    className={dangerButtonClassName}
                  >
                    {isDeleting === user.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </button>
            ))}
          {filteredUsers.length === 0 ? (
            <div className={emptyStateClassName}>
              No users match the current search or filters.
            </div>
          ) : null}
        </div>
      </div>

        <div className={panelClassName}>
          <h3 className="font-serif text-2xl text-slate-950">User branch history</h3>
          {selectedUser && selectedUserBranchHistory ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{selectedUser.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedUser.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!selectedUserLoginStatus?.loginReady ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                      Login not ready
                    </span>
                  ) : selectedUserLoginStatus.mustResetPassword ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                      First login password reset pending
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      User can sign in now
                    </span>
                  )}
                  {selectedUser.phone ? (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                      Phone login enabled
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-600">Home branch</p>
                    <p className="mt-2 font-medium text-slate-950">
                      {selectedUserBranchHistory.homeBranch?.name ?? selectedUser.branch ?? "Not assigned"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-600">Visited gyms</p>
                    <p className="mt-2 font-medium text-slate-950">
                      {selectedUserBranchHistory.totalVisitedBranches}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Total visits: {selectedUserBranchHistory.totalVisits}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Membership: {selectedUserBranchHistory.activeMembershipStatus}
                </p>
              </div>

              <div className="space-y-3">
                {selectedUserBranchHistory.branchSummary.length > 0 ? (
                  selectedUserBranchHistory.branchSummary.map((entry) => (
                    <div key={entry.branch?.id ?? entry.lastVisit} className="rounded-[1.25rem] bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {entry.branch?.name ?? "Unknown branch"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Last visit: {entry.lastVisit}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          {entry.count} visits
                        </span>
                      </div>
                      {entry.notes.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {entry.notes.slice(0, 3).map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-500">
                    No cross-branch visit history is available for this user yet. Their home branch is shown above.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select a user to view branch activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}
