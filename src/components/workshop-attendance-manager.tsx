"use client";

import { useMemo, useState } from "react";

import { Attendance, ClassSession, Profile } from "@/lib/types";

type WorkshopAttendanceManagerProps = {
  sessions: ClassSession[];
  attendance: Attendance[];
  members: Profile[];
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

export function WorkshopAttendanceManager({
  sessions,
  attendance,
  members,
}: WorkshopAttendanceManagerProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id ?? "");
  const [attendanceState, setAttendanceState] = useState(attendance);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const sessionAttendance = attendanceState.filter(
    (entry) => entry.sessionId === selectedSessionId,
  );

  const sessionSummary = useMemo(
    () => ({
      registered: sessionAttendance.filter((entry) => entry.status === "Booked").length,
      present: sessionAttendance.filter((entry) => entry.status === "Checked In").length,
      absent: sessionAttendance.filter((entry) => entry.status === "Missed").length,
    }),
    [sessionAttendance],
  );

  function updateAttendance(memberId: string, status: Attendance["status"]) {
    setAttendanceState((current) => {
      const existing = current.find(
        (entry) => entry.sessionId === selectedSessionId && entry.memberId === memberId,
      );

      if (existing) {
        return current.map((entry) =>
          entry.id === existing.id ? { ...entry, status } : entry,
        );
      }

      return [
        ...current,
        {
          id: `attendance-${selectedSessionId}-${memberId}`,
          sessionId: selectedSessionId,
          memberId,
          status,
        },
      ];
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Weekly workshop plan
        </p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">
          4-5 session attendance control
        </h2>
        <div className="mt-5 grid gap-3">
          {sessions.map((session) => {
            const present = attendanceState.filter(
              (entry) =>
                entry.sessionId === session.id && entry.status === "Checked In",
            ).length;

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSessionId(session.id)}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  selectedSessionId === session.id
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                  {session.day}
                </p>
                <p className="mt-2 font-semibold text-slate-950">{session.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {session.time} | {session.room}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  {present}/{session.capacity} marked present
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
          Client attendance
        </p>
        <h2 className="mt-2 font-serif text-2xl text-slate-950">
          {selectedSession?.title ?? "Choose a session"}
        </h2>
        <p className="mt-2 text-slate-600">
          {selectedSession?.day} at {selectedSession?.time} with {selectedSession?.coach}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Registered</p>
            <p className="mt-3 text-3xl font-semibold">{sessionSummary.registered}</p>
          </div>
          <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-emerald-800">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Present</p>
            <p className="mt-3 text-3xl font-semibold">{sessionSummary.present}</p>
          </div>
          <div className="rounded-[1.5rem] bg-rose-50 p-4 text-rose-800">
            <p className="text-sm uppercase tracking-[0.24em] text-rose-600">Absent</p>
            <p className="mt-3 text-3xl font-semibold">{sessionSummary.absent}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {members.map((member) => {
            const currentStatus =
              sessionAttendance.find((entry) => entry.memberId === member.id)?.status ??
              "Booked";

            return (
              <div
                key={member.id}
                className="rounded-[1.5rem] border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{member.fullName}</p>
                    <p className="text-sm text-slate-600">{member.fitnessGoal}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${statusStyles[currentStatus]}`}
                  >
                    {statusLabels[currentStatus]}
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
