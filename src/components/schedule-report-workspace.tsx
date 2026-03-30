"use client";

import { useMemo, useState } from "react";

import {
  FilterToolbar,
  FilterToolbarAction,
  FilterToolbarItem,
  FilterToolbarSearch,
  FilterToolbarSelect,
} from "@/components/filter-toolbar";
import { Attendance, ClassSession } from "@/lib/types";

type ScheduleReportWorkspaceProps = {
  sessions: ClassSession[];
  attendance: Attendance[];
};

export function ScheduleReportWorkspace({
  sessions,
  attendance,
}: ScheduleReportWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("All days");
  const [coachFilter, setCoachFilter] = useState("All coaches");
  const [sortBy, setSortBy] = useState<"dayTime" | "attendanceHigh" | "coach" | "title">("dayTime");

  const coachOptions = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.coach))).sort((a, b) => a.localeCompare(b)),
    [sessions],
  );
  const dayOptions = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.day))).sort((a, b) => a.localeCompare(b)),
    [sessions],
  );

  const filteredSessions = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return sessions
      .map((session) => {
        const sessionAttendance = attendance.filter((entry) => entry.sessionId === session.id);

        return {
          session,
          registeredCount: sessionAttendance.filter((entry) => entry.status !== "Missed").length,
          presentCount: sessionAttendance.filter((entry) => entry.status === "Checked In").length,
          missedCount: sessionAttendance.filter((entry) => entry.status === "Missed").length,
        };
      })
      .filter(({ session }) => {
        const matchesSearch =
          !normalized ||
          [session.title, session.day, session.time, session.coach, session.room, session.branchId ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesDay = dayFilter === "All days" || session.day === dayFilter;
        const matchesCoach = coachFilter === "All coaches" || session.coach === coachFilter;

        return matchesSearch && matchesDay && matchesCoach;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "attendanceHigh":
            return b.presentCount - a.presentCount || a.session.title.localeCompare(b.session.title);
          case "coach":
            return a.session.coach.localeCompare(b.session.coach) || a.session.title.localeCompare(b.session.title);
          case "title":
            return a.session.title.localeCompare(b.session.title);
          case "dayTime":
          default:
            return `${a.session.day} ${a.session.time}`.localeCompare(`${b.session.day} ${b.session.time}`);
        }
      });
  }, [attendance, coachFilter, dayFilter, searchQuery, sessions, sortBy]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (dayFilter !== "All days") params.set("day", dayFilter);
    if (coachFilter !== "All coaches") params.set("coach", coachFilter);
    params.set("sort", sortBy);

    return `/api/admin/schedule/export?${params.toString()}`;
  }, [coachFilter, dayFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      <FilterToolbar>
        <FilterToolbarItem className="min-w-[16rem] flex-[1.4]">
          <FilterToolbarSearch
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by class, day, coach, branch, or room"
          />
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={dayFilter}
            onChange={(event) => setDayFilter(event.target.value)}
          >
          <option value="All days">All days</option>
          {dayOptions.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
          </FilterToolbarSelect>
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
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "dayTime" | "attendanceHigh" | "coach" | "title")}
          >
          <option value="dayTime">Sort: Day and time</option>
          <option value="attendanceHigh">Sort: Highest attendance</option>
          <option value="coach">Sort: Coach</option>
          <option value="title">Sort: Title</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarAction href={exportUrl}>Export current view</FilterToolbarAction>
      </FilterToolbar>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredSessions.map(({ session, registeredCount, presentCount, missedCount }) => (
          <div key={session.id} className="rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              {session.day}
            </p>
            <h2 className="mt-2 font-serif text-2xl text-slate-950">{session.title}</h2>
            <p className="mt-2 text-slate-700">
              {session.time} with {session.coach}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {registeredCount}/{session.capacity} registered | {session.room}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Present {presentCount} · Missed {missedCount} · {session.zoomLink ? "Zoom ready" : "No Zoom link"}
            </p>
          </div>
        ))}
        {filteredSessions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-5 text-sm text-slate-500 lg:col-span-2">
            No sessions match the current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
