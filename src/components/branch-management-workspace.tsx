"use client";

import { useMemo, useState } from "react";

import { GymBranch, Profile, ClassSession, BranchVisit } from "@/lib/types";

type BranchOverviewItem = {
  branch: GymBranch;
  members: Profile[];
  sessions: ClassSession[];
  visits: BranchVisit[];
  activeMemberships: number;
};

type BranchManagementWorkspaceProps = {
  initialBranches: BranchOverviewItem[];
};

const emptyForm = {
  id: "",
  name: "",
  city: "",
  address: "",
  managerName: "",
  phone: "",
  kind: "Physical" as GymBranch["kind"],
};

export function BranchManagementWorkspace({
  initialBranches,
}: BranchManagementWorkspaceProps) {
  const [branches, setBranches] = useState(initialBranches);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<GymBranch["kind"] | "All branch types">(
    "All branch types",
  );
  const [sortBy, setSortBy] = useState<"name" | "city" | "membersHigh" | "visitsHigh">("name");
  const [formState, setFormState] = useState(emptyForm);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(
    () => ({
      branches: branches.length,
      members: branches.reduce((sum, branch) => sum + branch.members.length, 0),
      memberships: branches.reduce((sum, branch) => sum + branch.activeMemberships, 0),
      visits: branches.reduce((sum, branch) => sum + branch.visits.length, 0),
    }),
    [branches],
  );
  const filteredBranches = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return [...branches]
      .filter(({ branch }) => {
        const matchesSearch =
          !normalized ||
          [branch.name, branch.city, branch.address, branch.managerName, branch.phone]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesKind = kindFilter === "All branch types" || branch.kind === kindFilter;

        return matchesSearch && matchesKind;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "membersHigh":
            return b.members.length - a.members.length || a.branch.name.localeCompare(b.branch.name);
          case "visitsHigh":
            return b.visits.length - a.visits.length || a.branch.name.localeCompare(b.branch.name);
          case "city":
            return a.branch.city.localeCompare(b.branch.city) || a.branch.name.localeCompare(b.branch.name);
          case "name":
          default:
            return a.branch.name.localeCompare(b.branch.name);
        }
      });
  }, [branches, kindFilter, searchQuery, sortBy]);
  const filteredExportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    if (kindFilter !== "All branch types") {
      params.set("kind", kindFilter);
    }

    params.set("sort", sortBy);

    return `/api/admin/branches/export?${params.toString()}`;
  }, [kindFilter, searchQuery, sortBy]);

  function resetForm() {
    setFormState(emptyForm);
  }

  function handleEdit(branch: GymBranch) {
    setFormState(branch);
    setStatusMessage(`Editing ${branch.name}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/branches", {
      method: formState.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      branch?: GymBranch;
    };

    if (!response.ok || !payload.branch) {
      setStatusMessage(payload.error ?? "Branch save failed.");
      setIsSubmitting(false);
      return;
    }

    const nextBranch = payload.branch;

    setBranches((current) => {
      if (formState.id) {
        return current.map((item) =>
          item.branch.id === nextBranch.id
            ? { ...item, branch: nextBranch }
            : item,
        );
      }

      return [
        {
          branch: nextBranch,
          members: [],
          sessions: [],
          visits: [],
          activeMemberships: 0,
        },
        ...current,
      ];
    });

    setStatusMessage(payload.message ?? (formState.id ? "Branch updated." : "Branch created."));
    resetForm();
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Branches</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.branches}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Members mapped</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.members}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Active plans</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.memberships}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Visits tracked</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.visits}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl text-slate-950">
              {formState.id ? "Edit branch" : "Add branch"}
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
              placeholder="Branch name"
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="City"
              value={formState.city}
              onChange={(event) => setFormState((current) => ({ ...current, city: event.target.value }))}
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Address"
              value={formState.address}
              onChange={(event) => setFormState((current) => ({ ...current, address: event.target.value }))}
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Manager name"
              value={formState.managerName}
              onChange={(event) =>
                setFormState((current) => ({ ...current, managerName: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Phone"
              value={formState.phone}
              onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
            />
            <select
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              value={formState.kind}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  kind: event.target.value as GymBranch["kind"],
                }))
              }
            >
              <option value="Physical">Physical</option>
              <option value="Online">Online</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{statusMessage}</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
            >
              {isSubmitting ? "Saving..." : formState.id ? "Save branch" : "Create branch"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by branch, city, manager, or phone"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
              <select
                value={kindFilter}
                onChange={(event) =>
                  setKindFilter(event.target.value as GymBranch["kind"] | "All branch types")
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="All branch types">All branch types</option>
                <option value="Physical">Physical</option>
                <option value="Online">Online</option>
              </select>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as "name" | "city" | "membersHigh" | "visitsHigh")
                }
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="name">Sort: Name</option>
                <option value="city">Sort: City</option>
                <option value="membersHigh">Sort: Most members</option>
                <option value="visitsHigh">Sort: Most visits</option>
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
          {filteredBranches.map(({ branch, members, sessions, visits, activeMemberships }) => (
            <div
              key={branch.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-orange-600">{branch.kind}</p>
                  <h3 className="mt-2 font-serif text-2xl text-slate-950">{branch.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {branch.city || "City pending"} - {branch.address || "Address pending"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleEdit(branch)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Edit branch
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Members</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{members.length}</p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Sessions</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{sessions.length}</p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Visits</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{visits.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Active plans: {activeMemberships}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredBranches.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
              No branches match the current filters.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
