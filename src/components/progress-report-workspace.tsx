"use client";

import { useMemo, useState } from "react";

import {
  FilterToolbar,
  FilterToolbarAction,
  FilterToolbarItem,
  FilterToolbarSearch,
  FilterToolbarSelect,
} from "@/components/filter-toolbar";
import { Profile, ProgressCheckIn, ProgressPhoto } from "@/lib/types";

type ProgressReportWorkspaceProps = {
  members: Profile[];
  checkIns: ProgressCheckIn[];
  photos: ProgressPhoto[];
};

function getWeightDelta(firstWeight: number, lastWeight: number) {
  return Number((lastWeight - firstWeight).toFixed(1));
}

export function ProgressReportWorkspace({
  members,
  checkIns,
  photos,
}: ProgressReportWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All branches");
  const [energyFilter, setEnergyFilter] = useState<ProgressCheckIn["energyLevel"] | "All energy levels">(
    "All energy levels",
  );
  const [sortBy, setSortBy] = useState<"latestDate" | "weightDeltaHigh" | "name" | "branch">(
    "latestDate",
  );

  const branchOptions = useMemo(
    () =>
      Array.from(new Set(members.map((member) => member.branch).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [members],
  );

  const rows = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return members
      .map((member) => {
        const memberCheckIns = checkIns
          .filter((entry) => entry.memberId === member.id)
          .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));

        if (memberCheckIns.length === 0) {
          return null;
        }

        const latest = memberCheckIns[0];
        const oldest = memberCheckIns[memberCheckIns.length - 1];

        return {
          member,
          latest,
          oldest,
          photoCount: photos.filter((photo) => photo.memberId === member.id).length,
        };
      })
      .filter((item) => item !== null)
      .filter((item) => {
        const matchesSearch =
          !normalized ||
          [item.member.fullName, item.member.branch, item.member.fitnessGoal, item.latest.coachNote]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesBranch = branchFilter === "All branches" || item.member.branch === branchFilter;
        const matchesEnergy =
          energyFilter === "All energy levels" || item.latest.energyLevel === energyFilter;

        return matchesSearch && matchesBranch && matchesEnergy;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "weightDeltaHigh":
            return (
              getWeightDelta(b.oldest.weightKg, b.latest.weightKg) -
                getWeightDelta(a.oldest.weightKg, a.latest.weightKg) ||
              a.member.fullName.localeCompare(b.member.fullName)
            );
          case "name":
            return a.member.fullName.localeCompare(b.member.fullName);
          case "branch":
            return a.member.branch.localeCompare(b.member.branch) || a.member.fullName.localeCompare(b.member.fullName);
          case "latestDate":
          default:
            return b.latest.recordedOn.localeCompare(a.latest.recordedOn);
        }
      });
  }, [branchFilter, checkIns, energyFilter, members, photos, searchQuery, sortBy]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (branchFilter !== "All branches") params.set("branch", branchFilter);
    if (energyFilter !== "All energy levels") params.set("energy", energyFilter);
    params.set("sort", sortBy);

    return `/api/admin/progress/export?${params.toString()}`;
  }, [branchFilter, energyFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      <FilterToolbar>
        <FilterToolbarItem className="min-w-[16rem] flex-[1.4]">
          <FilterToolbarSearch
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by member, branch, goal, or coach note"
          />
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
          <option value="All branches">All branches</option>
          {branchOptions.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={energyFilter}
            onChange={(event) =>
              setEnergyFilter(event.target.value as ProgressCheckIn["energyLevel"] | "All energy levels")
            }
          >
          <option value="All energy levels">All energy levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "latestDate" | "weightDeltaHigh" | "name" | "branch")
            }
          >
          <option value="latestDate">Sort: Latest check-in</option>
          <option value="weightDeltaHigh">Sort: Highest weight delta</option>
          <option value="name">Sort: Name</option>
          <option value="branch">Sort: Branch</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarAction href={exportUrl}>Export current view</FilterToolbarAction>
      </FilterToolbar>

      <div className="space-y-4">
        {rows.map((item) => (
          <div key={item.member.id} className="rounded-[1.5rem] border border-slate-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{item.member.fullName}</p>
                <p className="text-sm text-slate-600">{item.member.fitnessGoal}</p>
              </div>
              <p className="text-sm font-medium text-orange-700">Latest {item.latest.recordedOn}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weight</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.latest.weightKg} kg</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Delta</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {getWeightDelta(item.oldest.weightKg, item.latest.weightKg)} kg
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Waist</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.latest.waistCm} cm</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Photos</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.photoCount}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{item.latest.coachNote}</p>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-5 text-sm text-slate-500">
            No progress records match the current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
