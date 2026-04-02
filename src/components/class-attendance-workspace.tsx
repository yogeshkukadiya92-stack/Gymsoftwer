"use client";

import { useState } from "react";

import { Attendance, ClassSession, Profile } from "@/lib/types";

type AttendanceClass = ClassSession & {
  category: string;
};

type ClassAttendanceWorkspaceProps = {
  sessions: ClassSession[];
  attendance: Attendance[];
  members: Profile[];
};

type FilterState = {
  category: string;
  day: string;
  coach: string;
  time: string;
};

type ImportResult = {
  message?: string;
  error?: string;
  summary?: Array<{ sheet: string; rows: number }>;
};

const defaultFilters: FilterState = {
  category: "All",
  day: "All",
  coach: "All",
  time: "",
};

const statusStyles = {
  Booked: "border-slate-300 bg-white text-slate-700",
  "Checked In": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Missed: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const statusLabels = {
  Booked: "Registered",
  "Checked In": "Present",
  Missed: "Absent",
} as const;

function guessCategory(session: ClassSession) {
  const title = session.title.toLowerCase();

  if (title.includes("mobility") || title.includes("yoga")) {
    return "Yoga";
  }

  if (title.includes("core")) {
    return "Core";
  }

  if (title.includes("strength")) {
    return "Strength";
  }

  return "Workshop";
}

export function ClassAttendanceWorkspace({
  sessions,
  attendance,
  members,
}: ClassAttendanceWorkspaceProps) {
  const initialClasses: AttendanceClass[] = sessions.map((session) => ({
    ...session,
    category: guessCategory(session),
  }));

  const [classes] = useState(initialClasses);
  const [attendanceState, setAttendanceState] = useState(attendance);
  const [selectedClassId, setSelectedClassId] = useState(initialClasses[0]?.id ?? "");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const categories = Array.from(new Set(classes.map((item) => item.category)));
  const days = Array.from(new Set(classes.map((item) => item.day)));
  const coaches = Array.from(new Set(classes.map((item) => item.coach)));

  const filteredClasses = classes.filter((item) => {
    const matchesCategory =
      filters.category === "All" || item.category === filters.category;
    const matchesDay = filters.day === "All" || item.day === filters.day;
    const matchesCoach = filters.coach === "All" || item.coach === filters.coach;
    const matchesTime =
      !filters.time ||
      item.time.toLowerCase().includes(filters.time.trim().toLowerCase());

    return matchesCategory && matchesDay && matchesCoach && matchesTime;
  });

  const availableClassIds = new Set(filteredClasses.map((item) => item.id));
  const selectedClass = filteredClasses.find((session) => session.id === selectedClassId)
    ?? classes.find((session) => session.id === selectedClassId)
    ?? filteredClasses[0];

  const selectedAttendance = attendanceState.filter(
    (entry) => entry.sessionId === selectedClass?.id,
  );

  const attendeesForSelectedClass = selectedAttendance
    .map((entry) => {
      const member = members.find((item) => item.id === entry.memberId);

      if (!member) {
        return null;
      }

      return {
        member,
        status: entry.status,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const summary = {
    registered: selectedAttendance.filter((entry) => entry.status === "Booked").length,
    present: selectedAttendance.filter((entry) => entry.status === "Checked In").length,
    absent: selectedAttendance.filter((entry) => entry.status === "Missed").length,
  };

  function updateAttendance(memberId: string, status: Attendance["status"]) {
    if (!selectedClass?.id) {
      return;
    }

    setAttendanceState((current) => {
      const existing = current.find(
        (entry) => entry.sessionId === selectedClass.id && entry.memberId === memberId,
      );

      if (existing) {
        return current.map((entry) =>
          entry.id === existing.id ? { ...entry, status } : entry,
        );
      }

      return [
        ...current,
        {
          id: `attendance-${selectedClass.id}-${memberId}`,
          sessionId: selectedClass.id,
          memberId,
          status,
        },
      ];
    });
  }

  async function handleAttendanceImport(formData: FormData) {
    setIsUploading(true);
    setImportResult(null);

    const response = await fetch("/api/admin/attendance/import", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as ImportResult;
    setImportResult(payload);
    setIsUploading(false);
  }

  const groupedFilteredClasses = categories
    .map((category) => ({
      category,
      items: filteredClasses.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Filters and Excel
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            Time-based filters and import/export
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({ ...current, category: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={filters.day}
              onChange={(event) =>
                setFilters((current) => ({ ...current, day: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="All">All days</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select
              value={filters.coach}
              onChange={(event) =>
                setFilters((current) => ({ ...current, coach: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="All">All coaches</option>
              {coaches.map((coach) => (
                <option key={coach} value={coach}>
                  {coach}
                </option>
              ))}
            </select>
            <input
              value={filters.time}
              onChange={(event) =>
                setFilters((current) => ({ ...current, time: event.target.value }))
              }
              className="rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Filter by time e.g. 07:00"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFilters(defaultFilters)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Reset filters
            </button>
            <a
              href="/api/admin/attendance/export"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Export attendance Excel
            </a>
            <a
              href="/api/admin/attendance/template"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Download template
            </a>
          </div>
          <form
            className="mt-5 space-y-4"
            action={async (formData) => {
              await handleAttendanceImport(formData);
            }}
          >
            <input
              className="block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
              type="file"
              name="file"
              accept=".xlsx"
              required
            />
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-70"
            >
              {isUploading ? "Checking attendance file..." : "Import attendance Excel"}
            </button>
          </form>
          {importResult ? (
            <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4">
              {importResult.error ? (
                <p className="font-medium text-rose-700">{importResult.error}</p>
              ) : null}
              {importResult.message ? (
                <p className="font-medium text-emerald-700">{importResult.message}</p>
              ) : null}
              {importResult.summary ? (
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  {importResult.summary.map((item) => (
                    <div
                      key={item.sheet}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                    >
                      <span>{item.sheet}</span>
                      <span className="font-semibold">{item.rows} rows</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Class list
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            Filtered attendance classes
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {filteredClasses.length} class(es) match current filters.
          </p>
          <div className="mt-5 space-y-5">
            {groupedFilteredClasses.length > 0 ? (
              groupedFilteredClasses.map((group) => (
                <div key={group.category}>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {group.category}
                  </p>
                  <div className="grid gap-3">
                    {group.items.map((session) => {
                      const classAttendeeCount = attendanceState.filter(
                        (entry) => entry.sessionId === session.id,
                      ).length;

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => setSelectedClassId(session.id)}
                          className={`rounded-[1.5rem] border p-4 text-left ${
                            selectedClassId === session.id
                              ? "border-orange-300 bg-orange-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950">{session.title}</p>
                              <p className="mt-1 text-sm text-slate-600">
                                {session.day} | {session.time}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                              {classAttendeeCount} attendees
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {session.coach} | {session.room}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                No classes match the current filters. Reset the filters or import the latest attendance workbook.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Attendance manager
          </p>
          <h2 className="mt-2 font-serif text-2xl text-slate-950">
            {selectedClass?.title ?? "Select a class"}
          </h2>
          <p className="mt-2 text-slate-600">
            {selectedClass?.category} | {selectedClass?.day} | {selectedClass?.time}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Selected class na actual attendees niche dekhashe.
            {!availableClassIds.has(selectedClass?.id ?? "")
              ? " This class does not match the current filters but is still selected."
              : ""}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Registered</p>
              <p className="mt-3 text-3xl font-semibold">{summary.registered}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-800">
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Present</p>
              <p className="mt-3 text-3xl font-semibold">{summary.present}</p>
            </div>
            <div className="rounded-[1.5rem] bg-rose-50 p-4 text-rose-800">
              <p className="text-sm uppercase tracking-[0.24em] text-rose-600">Absent</p>
              <p className="mt-3 text-3xl font-semibold">{summary.absent}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {attendeesForSelectedClass.length > 0 ? (
              attendeesForSelectedClass.map(({ member, status }) => (
                <div key={member.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{member.fullName}</p>
                      <p className="text-sm text-slate-600">{member.fitnessGoal}</p>
                      <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${statusStyles[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateAttendance(member.id, "Booked")}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      Registered
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAttendance(member.id, "Checked In")}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAttendance(member.id, "Missed")}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                No attendees have been added for this class yet. Import the attendance workbook or collect the latest class registrations through your form flow.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
