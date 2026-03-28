"use client";

import { useState } from "react";

import { Attendance, ClassSession } from "@/lib/types";

type MemberSessionListProps = {
  sessions: ClassSession[];
  attendance: Attendance[];
  viewerId: string;
};

export function MemberSessionList({
  sessions,
  attendance,
  viewerId,
}: MemberSessionListProps) {
  const [attendanceState, setAttendanceState] = useState(attendance);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleJoin(session: ClassSession) {
    setJoiningSessionId(session.id);
    setMessage("");

    const response = await fetch("/api/member/sessions/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: session.id }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      joinUrl?: string;
    };

    if (!response.ok || !payload.joinUrl) {
      setMessage(payload.error ?? "Join failed.");
      setJoiningSessionId(null);
      return;
    }

    setAttendanceState((current) => {
      const existing = current.find((entry) => entry.sessionId === session.id);

      if (existing) {
        return current.map((entry) =>
          entry.id === existing.id ? { ...entry, status: "Checked In" } : entry,
        );
      }

      return [
        ...current,
        {
          id: `attendance-${session.id}-viewer`,
          sessionId: session.id,
          memberId: viewerId,
          status: "Checked In",
        },
      ];
    });

    window.open(payload.joinUrl, "_blank", "noopener,noreferrer");
    setMessage(payload.message ?? "Attendance marked.");
    setJoiningSessionId(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sessions.map((session) => {
        const attendanceStatus =
          attendanceState.find((entry) => entry.sessionId === session.id)?.status ?? "Booked";

        const statusLabel =
          attendanceStatus === "Checked In"
            ? "Present"
            : attendanceStatus === "Missed"
              ? "Absent"
              : "Registered";

        return (
          <div key={session.id} className="rounded-[1.5rem] border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
                  {session.day}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-slate-950">{session.title}</h2>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                {statusLabel}
              </span>
            </div>
            <p className="mt-2 text-slate-700">
              {session.time} with {session.coach}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Capacity {session.capacity} | {session.room}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleJoin(session)}
                disabled={!session.zoomLink || joiningSessionId === session.id}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joiningSessionId === session.id ? "Joining..." : "Join now"}
              </button>
              <span className="text-xs text-slate-500">
                {session.zoomLink ? "Zoom link ready" : "Zoom link not added yet"}
              </span>
            </div>
          </div>
        );
      })}
      {message ? (
        <div className="lg:col-span-2 rounded-[1.5rem] bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
    </div>
  );
}
