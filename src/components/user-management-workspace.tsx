"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import {
  emptyStateClassName,
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
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRepairing, setIsRepairing] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [bulkPasteValue, setBulkPasteValue] = useState("");
  const [showBulkTools, setShowBulkTools] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const showBranchHistory = showCreateUser;

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
  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedUserIds.includes(user.id));

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function toggleSelectAllFiltered() {
    setSelectedUserIds((current) =>
      allFilteredSelected
        ? current.filter((id) => !filteredUsers.some((user) => user.id === id))
        : [...new Set([...current, ...filteredUsers.map((user) => user.id)])],
    );
  }

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
      return null;
    }

    setUsers(payload.users);
    setLoginStatuses(payload.loginStatuses ?? []);
    setUserPermissions(payload.userPermissions ?? []);
    if (!selectedUserId && payload.users.length > 0) {
      setSelectedUserId(payload.users[0].id);
    }

    return payload;
  }

  async function handleVerifyLogin(user?: Profile) {
    const targetUser = user ?? selectedUser;

    if (!targetUser) {
      return;
    }

    setIsVerifying(true);
    setStatusMessage("");
    const refreshedPayload = await refreshUsers();

    const refreshedStatus =
      refreshedPayload?.loginStatuses?.find((entry) => entry.userId === targetUser.id) ?? null;

    if (!refreshedStatus?.loginReady) {
      setStatusMessage(`Verification complete for ${targetUser.fullName}: login account is still not ready.`);
    } else if (refreshedStatus.mustResetPassword) {
      setStatusMessage(`Verification complete for ${targetUser.fullName}: user can sign in and will be asked to reset the password.`);
    } else {
      setStatusMessage(`Verification complete for ${targetUser.fullName}: user can sign in now.`);
    }

    setIsVerifying(false);
  }

  async function handleRepairLogin(user?: Profile) {
    const targetUser = user ?? selectedUser;

    if (!targetUser) {
      return;
    }

    setIsRepairing(targetUser.id);
    setStatusMessage("");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "repair",
        id: targetUser.id,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      setStatusMessage(payload.error ?? `Login repair failed for ${targetUser.fullName}.`);
      setIsRepairing(null);
      return;
    }

    await handleVerifyLogin(targetUser);
    setStatusMessage(
      payload.message ??
        `Login repaired successfully for ${targetUser.fullName}. Default password: ${DEFAULT_FIRST_LOGIN_PASSWORD}`,
    );
    setIsRepairing(null);
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

  async function handleImportUpload() {
    const file = selectedImportFile ?? importInputRef.current?.files?.[0] ?? null;

    if (!file) {
      setStatusMessage("Please select a users Excel file first.");
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

    const contentType = response.headers.get("content-type") || "";
    const payload = (contentType.includes("application/json")
      ? await response.json()
      : {
          error:
            response.status === 401
              ? "Admin login required for user import."
              : "Users import failed.",
        }) as {
      error?: string;
      message?: string;
      saved?: { imported: number; updated: number; failed?: number };
      duplicateEmails?: string[];
      failedRows?: Array<{ email: string; reason: string }>;
    };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Users import failed.");
      setIsImporting(false);
      return;
    }

    await refreshUsers();
    setStatusMessage(
      `${payload.message ?? "Users imported."} Imported: ${payload.saved?.imported ?? 0}, updated: ${payload.saved?.updated ?? 0}${
        payload.saved?.failed
          ? `, failed: ${payload.saved.failed}`
          : ""
      }${
        payload.duplicateEmails?.length
          ? `, duplicate emails in file: ${payload.duplicateEmails.join(", ")}`
          : ""
      }${
        payload.failedRows?.length
          ? `. Issues: ${payload.failedRows
              .map((row) => `${row.email || "unknown"} (${row.reason})`)
              .join("; ")}`
          : ""
      }`,
    );
    setSelectedImportFile(null);
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
    setIsImporting(false);
  }

  async function handleQuickBulkCreate() {
    const lines = bulkPasteValue
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setStatusMessage("Paste at least one user row first.");
      return;
    }

    const rows = lines
      .map((line) => line.split(",").map((part) => part.trim()))
      .filter((parts) => parts.length >= 3)
      .map((parts) => ({
        fullName: parts[0] || "",
        email: parts[1] || "",
        phone: parts[2] || "",
        role: (parts[3] || "member") as "member" | "trainer" | "admin",
        branch: parts[4] || "",
        membershipStartDate: parts[5] || "",
        membershipEndDate: parts[6] || "",
        password: DEFAULT_FIRST_LOGIN_PASSWORD,
        joinedOn: parts[5] || new Date().toISOString().slice(0, 10),
      }))
      .filter((row) => row.fullName && row.email && row.phone);

    if (rows.length === 0) {
      setStatusMessage(
        "Invalid bulk format. Use: Name, Email, Phone, Role, Branch, Start Date, End Date",
      );
      return;
    }

    setIsQuickAdding(true);
    setStatusMessage("");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "bulk_create",
        rows,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      saved?: { imported: number; updated: number; failed?: number };
      failedRows?: Array<{ email: string; reason: string }>;
    };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Quick bulk user creation failed.");
      setIsQuickAdding(false);
      return;
    }

    await refreshUsers();
    setBulkPasteValue("");
    setStatusMessage(
      `${payload.message ?? "Bulk users created."} Imported: ${payload.saved?.imported ?? 0}, updated: ${payload.saved?.updated ?? 0}${
        payload.saved?.failed ? `, failed: ${payload.saved.failed}` : ""
      }${
        payload.failedRows?.length
          ? `. Issues: ${payload.failedRows
              .map((row) => `${row.email || "unknown"} (${row.reason})`)
              .join("; ")}`
          : ""
      }`,
    );
    setIsQuickAdding(false);
  }

  async function handleBulkVerify() {
    const targets = users.filter((user) => selectedUserIds.includes(user.id));

    if (targets.length === 0) {
      setStatusMessage("Select at least one user first.");
      return;
    }

    setIsBulkProcessing(true);
    setStatusMessage("");

    for (const user of targets) {
      await handleVerifyLogin(user);
    }

    setStatusMessage(`Verified ${targets.length} selected users.`);
    setIsBulkProcessing(false);
  }

  async function handleBulkRepair() {
    const targets = users.filter((user) => selectedUserIds.includes(user.id));

    if (targets.length === 0) {
      setStatusMessage("Select at least one user first.");
      return;
    }

    setIsBulkProcessing(true);
    setStatusMessage("");

    for (const user of targets) {
      await handleRepairLogin(user);
    }

    setStatusMessage(`Repair flow completed for ${targets.length} selected users.`);
    setIsBulkProcessing(false);
  }

  async function handleBulkDelete() {
    const targets = users.filter((user) => selectedUserIds.includes(user.id));

    if (targets.length === 0) {
      setStatusMessage("Select at least one user first.");
      return;
    }

    setIsBulkProcessing(true);
    setStatusMessage("");

    for (const user of targets) {
      await handleDelete(user);
    }

    setSelectedUserIds([]);
    setStatusMessage(`Deleted ${targets.length} selected users.`);
    setIsBulkProcessing(false);
  }

  return (
    <div className="space-y-6">
      <div className={`${panelClassName} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <h3 className="font-serif text-2xl text-slate-950">Users page controls</h3>
          <p className="mt-2 text-sm text-slate-500">
            Show or hide extra sections to keep the page cleaner.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowBulkTools((current) => !current)}
            className={secondaryButtonClassName}
          >
            {showBulkTools ? "Hide bulk tools" : "Show bulk tools"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateUser((current) => !current)}
            className={secondaryButtonClassName}
          >
            {showCreateUser ? "Hide create user" : "Show create user"}
          </button>
        </div>
      </div>

      {showBulkTools ? (
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
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_auto] md:items-center">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx"
            className={fieldClassName}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedImportFile(file);
              setStatusMessage(file ? `Selected file: ${file.name}` : "No file selected.");
            }}
            disabled={isImporting}
          />
          <button
            type="button"
            onClick={handleImportUpload}
            disabled={isImporting || !selectedImportFile}
            className={primaryButtonClassName}
          >
            {isImporting ? "Importing..." : "Upload selected file"}
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {selectedImportFile ? (
            <>
              Ready to upload:{" "}
              <span className="font-semibold text-slate-950">{selectedImportFile.name}</span>
            </>
          ) : (
            "Choose a .xlsx users file, then click Upload selected file."
          )}
        </p>

        <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-serif text-xl text-slate-950">Quick bulk add</h4>
          <p className="mt-2 text-sm text-slate-500">
            Paste one user per line:
            <span className="ml-1 font-medium text-slate-700">
              Name, Email, Phone, Role, Branch, Start Date, End Date
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Example: Amit Patel, amit@gmail.com, 9876543210, member, Main Branch, 2026-04-03, 2026-05-03
          </p>
          <textarea
            className={`${fieldClassName} mt-4 min-h-40`}
            placeholder={"Amit Patel, amit@gmail.com, 9876543210, member, Main Branch, 2026-04-03, 2026-05-03\nRiya Shah, riya@gmail.com, 9988776655, member, Online Branch, 2026-04-03, 2026-05-03"}
            value={bulkPasteValue}
            onChange={(event) => setBulkPasteValue(event.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleQuickBulkCreate}
              disabled={isQuickAdding}
              className={primaryButtonClassName}
            >
              {isQuickAdding ? "Creating users..." : "Create users from pasted list"}
            </button>
            <button
              type="button"
              onClick={() => setBulkPasteValue("")}
              className={secondaryButtonClassName}
            >
              Clear pasted data
            </button>
          </div>
        </div>
      </div>
      ) : null}

      <div
        className={`grid gap-6 ${
          showCreateUser
            ? "xl:grid-cols-[0.9fr_1.1fr_0.95fr]"
            : "xl:grid-cols-[minmax(0,1fr)]"
        }`}
      >
        {showCreateUser ? (
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
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleRepairLogin()}
                disabled={isRepairing !== null || !selectedUser}
                className={secondaryButtonClassName}
              >
                {isRepairing && selectedUser ? "Repairing..." : "Repair login"}
              </button>
              <button
                type="button"
                onClick={() => handleVerifyLogin()}
                disabled={isVerifying || !selectedUser}
                className={secondaryButtonClassName}
              >
                {isVerifying ? "Verifying..." : "Verify login"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={primaryButtonClassName}
              >
                {isSubmitting ? "Saving..." : editingUserId ? "Save changes" : "Create user"}
              </button>
            </div>
          </div>
        </form>
        ) : (
          <div className={`${panelClassName} flex items-center justify-center text-center text-sm text-slate-500`}>
            Create user section is hidden. Use the toggle above to show it again.
          </div>
        )}

        <div className={panelClassName}>
          <h3 className="font-serif text-2xl text-slate-950">Existing users</h3>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm text-slate-600">
              Selected users: <span className="font-semibold text-slate-950">{selectedUserIds.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className={secondaryButtonClassName}
              >
                {allFilteredSelected ? "Clear page selection" : "Select all on page"}
              </button>
              <button
                type="button"
                onClick={() => void handleBulkVerify()}
                disabled={isBulkProcessing || selectedUserIds.length === 0}
                className={secondaryButtonClassName}
              >
                {isBulkProcessing ? "Processing..." : "Verify selected"}
              </button>
              <button
                type="button"
                onClick={() => void handleBulkRepair()}
                disabled={isBulkProcessing || selectedUserIds.length === 0}
                className={secondaryButtonClassName}
              >
                {isBulkProcessing ? "Processing..." : "Repair selected"}
              </button>
              <button
                type="button"
                onClick={() => void handleBulkDelete()}
                disabled={isBulkProcessing || selectedUserIds.length === 0}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBulkProcessing ? "Processing..." : "Delete selected"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] p-3">
            <input
              className={fieldClassName}
              placeholder="Search by name, email, phone, or access label"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <div className={`grid gap-3 ${showCreateUser ? "md:grid-cols-2" : "xl:grid-cols-3"}`}>
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
          </div>
          <div className="overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-white">
            <table className="min-w-[980px] w-full text-left">
              <thead className="bg-slate-950 text-white">
                <tr className="text-xs uppercase tracking-[0.18em]">
                  <th className="px-4 py-3 font-semibold">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="h-4 w-4 accent-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Branch</th>
                  <th className="px-4 py-3 font-semibold">Access</th>
                  <th className="px-4 py-3 font-semibold">Login</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const permissionLabel =
                    userPermissions.find((entry) => entry.userId === user.id)?.accessLabel ?? "";
                  const status = loginStatuses.find((entry) => entry.userId === user.id);

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`cursor-pointer border-t border-slate-200 text-sm transition ${
                        selectedUserId === user.id
                          ? "bg-orange-50/70"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-2.5 align-top">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleUserSelection(user.id);
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1 h-4 w-4 accent-orange-500"
                        />
                      </td>
                      <td className="px-4 py-2.5 align-top font-medium text-slate-950">
                        <span className="block max-w-[220px] leading-6">{user.fullName}</span>
                      </td>
                      <td className="px-4 py-2.5 align-top text-slate-700">
                        <span className="block max-w-[260px] truncate leading-6">{user.email}</span>
                      </td>
                      <td className="px-4 py-2.5 align-top text-slate-700 whitespace-nowrap">{user.phone || "-"}</td>
                      <td className="px-4 py-2.5 align-top">
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-top text-slate-700">
                        <span className="block max-w-[160px] leading-6">{user.branch || "-"}</span>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        {permissionLabel ? (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
                            {permissionLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        {!status?.loginReady ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                            Not ready
                          </span>
                        ) : status.mustResetPassword ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                            Reset pending
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                            Ready
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-top text-slate-700 whitespace-nowrap">{user.joinedOn || "-"}</td>
                      <td className="px-4 py-2.5 align-top">
                        <div className="flex flex-nowrap gap-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(user);
                            }}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleVerifyLogin(user);
                            }}
                            disabled={isVerifying}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleRepairLogin(user);
                            }}
                            disabled={isRepairing !== null}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isRepairing === user.id ? "Repairing..." : "Repair"}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(user);
                            }}
                            disabled={isDeleting === user.id}
                            className="rounded-full border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting === user.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 ? (
            <div className={emptyStateClassName}>
              No users match the current search or filters.
            </div>
          ) : null}
        </div>
      </div>

        {showBranchHistory ? (
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
                {selectedUser.role === "member" ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/diet-planner?userId=${selectedUser.id}`}
                      className={secondaryButtonClassName}
                    >
                      Create diet plan
                    </Link>
                  </div>
                ) : null}
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
        ) : null}
      </div>
    </div>
  );
}
