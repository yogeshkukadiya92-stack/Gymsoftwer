"use client";

import { useMemo, useState } from "react";

import { LeadRecord, LeadStatus } from "@/lib/business-data";

type LeadCrmWorkspaceProps = {
  leads: LeadRecord[];
};

const statuses: LeadStatus[] = ["New", "Contacted", "Trial Booked", "Converted", "Lost"];

export function LeadCrmWorkspace({ leads }: LeadCrmWorkspaceProps) {
  const [query, setQuery] = useState("");

  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return leads;
    }

    return leads.filter((lead) =>
      [lead.fullName, lead.phone, lead.goal, lead.source, lead.status, lead.assignedTo, lead.note]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [leads, query]);

  return (
    <div className="space-y-6">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by lead name, goal, source, or coach..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {statuses.map((status) => (
          <div key={status} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-950">{status}</h3>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                {filteredLeads.filter((lead) => lead.status === status).length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {filteredLeads
                .filter((lead) => lead.status === status)
                .map((lead) => (
                  <div key={lead.id} className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="font-semibold text-slate-950">{lead.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.goal}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-orange-600">
                      {lead.source}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{lead.assignedTo}</p>
                    <p className="mt-2 text-sm text-slate-500">{lead.nextFollowUp}</p>
                    <p className="mt-3 text-sm text-slate-600">{lead.note}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
