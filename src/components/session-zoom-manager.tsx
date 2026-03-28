"use client";

import { useState } from "react";

import { ClassSession } from "@/lib/types";

type SessionZoomManagerProps = {
  sessions: ClassSession[];
};

export function SessionZoomManager({ sessions }: SessionZoomManagerProps) {
  const [sessionState, setSessionState] = useState(sessions);
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id ?? "");
  const [zoomLink, setZoomLink] = useState(sessions[0]?.zoomLink ?? "");
  const [room, setRoom] = useState(sessions[0]?.room ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedSession = sessionState.find((session) => session.id === selectedSessionId);

  function handleSelect(sessionId: string) {
    const session = sessionState.find((item) => item.id === sessionId);
    setSelectedSessionId(sessionId);
    setZoomLink(session?.zoomLink ?? "");
    setRoom(session?.room ?? "");
    setMessage("");
  }

  async function handleSave() {
    if (!selectedSessionId || !zoomLink.trim()) {
      setMessage("Session and Zoom link are required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/sessions/zoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: selectedSessionId,
        zoomLink,
        room,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      session?: ClassSession;
    };

    if (!response.ok || !payload.session) {
      setMessage(payload.error ?? "Zoom link save failed.");
      setIsSaving(false);
      return;
    }

    setSessionState((current) =>
      current.map((session) =>
        session.id === payload.session?.id ? payload.session : session,
      ),
    );
    setMessage(payload.message ?? "Zoom link saved.");
    setIsSaving(false);
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
        Online session links
      </p>
      <h2 className="mt-2 font-serif text-2xl text-slate-950">
        Save Zoom link for each class
      </h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {sessionState.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => handleSelect(session.id)}
              className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                selectedSessionId === session.id
                  ? "border-orange-300 bg-orange-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="font-semibold text-slate-950">{session.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {session.day} | {session.time} | {session.coach}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {session.zoomLink ? "Zoom link added" : "No Zoom link yet"}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-[1.5rem] bg-slate-50 p-4">
          <p className="font-semibold text-slate-950">
            {selectedSession?.title ?? "Select a session"}
          </p>
          <input
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            placeholder="Zoom room label"
          />
          <input
            value={zoomLink}
            onChange={(event) => setZoomLink(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            placeholder="https://zoom.us/j/..."
            type="url"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save Zoom link"}
          </button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
