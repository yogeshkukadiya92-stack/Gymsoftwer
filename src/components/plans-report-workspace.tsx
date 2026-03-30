"use client";

import { useMemo, useState } from "react";

import {
  FilterToolbar,
  FilterToolbarAction,
  FilterToolbarItem,
  FilterToolbarSearch,
  FilterToolbarSelect,
} from "@/components/filter-toolbar";
import { Profile, WorkoutAssignment, WorkoutPlan } from "@/lib/types";

type PlansReportWorkspaceProps = {
  plans: WorkoutPlan[];
  assignments: WorkoutAssignment[];
  profiles: Profile[];
};

export function PlansReportWorkspace({
  plans,
  assignments,
  profiles,
}: PlansReportWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [coachFilter, setCoachFilter] = useState("All coaches");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<
    WorkoutAssignment["status"] | "All assignments"
  >("All assignments");
  const [sortBy, setSortBy] = useState<"name" | "coach" | "durationHigh">("name");

  const coachOptions = useMemo(
    () => Array.from(new Set(plans.map((plan) => plan.coach))).sort((a, b) => a.localeCompare(b)),
    [plans],
  );

  const filteredPlans = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return [...plans]
      .filter((plan) => {
        const matchesSearch =
          !normalized ||
          [plan.name, plan.goal, plan.coach, plan.split].join(" ").toLowerCase().includes(normalized);
        const matchesCoach = coachFilter === "All coaches" || plan.coach === coachFilter;
        return matchesSearch && matchesCoach;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "coach":
            return a.coach.localeCompare(b.coach) || a.name.localeCompare(b.name);
          case "durationHigh":
            return b.durationWeeks - a.durationWeeks || a.name.localeCompare(b.name);
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [coachFilter, plans, searchQuery, sortBy]);

  const filteredAssignments = useMemo(
    () => {
      const includedPlanIds = new Set(filteredPlans.map((plan) => plan.id));

      return assignments.filter(
        (assignment) =>
          includedPlanIds.has(assignment.planId) &&
          (assignmentStatusFilter === "All assignments" || assignment.status === assignmentStatusFilter),
      );
    },
    [assignmentStatusFilter, assignments, filteredPlans],
  );

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (coachFilter !== "All coaches") params.set("coach", coachFilter);
    if (assignmentStatusFilter !== "All assignments") {
      params.set("assignmentStatus", assignmentStatusFilter);
    }
    params.set("sort", sortBy);
    return `/api/admin/plans/export?${params.toString()}`;
  }, [assignmentStatusFilter, coachFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      <FilterToolbar>
        <FilterToolbarItem className="min-w-[16rem] flex-[1.4]">
          <FilterToolbarSearch
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by plan, goal, coach, or split"
          />
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={coachFilter}
            onChange={(event) => setCoachFilter(event.target.value)}
          >
          <option value="All coaches">All coaches</option>
          {coachOptions.map((coach) => (
            <option key={coach} value={coach}>
              {coach}
            </option>
          ))}
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={assignmentStatusFilter}
            onChange={(event) =>
              setAssignmentStatusFilter(
                event.target.value as WorkoutAssignment["status"] | "All assignments",
              )
            }
          >
          <option value="All assignments">All assignments</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Completed">Completed</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "name" | "coach" | "durationHigh")}
          >
          <option value="name">Sort: Name</option>
          <option value="coach">Sort: Coach</option>
          <option value="durationHigh">Sort: Longest duration</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarAction href={exportUrl}>Export current view</FilterToolbarAction>
      </FilterToolbar>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Templates</p>
          <h3 className="mt-2 font-serif text-2xl text-slate-950">Workout plans</h3>
          <div className="mt-4 space-y-4">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{plan.name}</p>
                    <p className="text-sm text-slate-600">{plan.goal}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {plan.split} · {plan.durationWeeks} weeks
                  </p>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Coach {plan.coach} · {plan.exercises.length} exercises
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Assignments</p>
          <h3 className="mt-2 font-serif text-2xl text-slate-950">Current member mappings</h3>
          <div className="mt-4 space-y-4">
            {filteredAssignments.map((assignment) => {
              const plan = plans.find((entry) => entry.id === assignment.planId);
              const member = profiles.find((entry) => entry.id === assignment.memberId);

              return (
                <div key={assignment.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <p className="font-semibold text-slate-950">{member?.fullName}</p>
                  <p className="mt-2 text-slate-600">{plan?.name}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Started {assignment.startDate} · {assignment.status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
