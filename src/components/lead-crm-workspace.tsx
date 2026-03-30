"use client";

import { useMemo, useState } from "react";

import { LeadRecord, LeadSource, LeadStatus } from "@/lib/business-data";

type LeadCrmWorkspaceProps = {
  leads: LeadRecord[];
};

const statuses: LeadStatus[] = ["New", "Contacted", "Trial Booked", "Converted", "Lost"];
const sources: LeadSource[] = ["WhatsApp", "Instagram", "Referral", "Walk-in", "Website"];

const emptyForm = {
  id: "",
  fullName: "",
  phone: "",
  goal: "",
  source: "Website" as LeadSource,
  status: "New" as LeadStatus,
  assignedTo: "",
  nextFollowUp: new Date().toISOString().slice(0, 10),
  note: "",
};

export function LeadCrmWorkspace({ leads: initialLeads }: LeadCrmWorkspaceProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All statuses">("All statuses");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "All sources">("All sources");
  const [sortBy, setSortBy] = useState<"nextFollowUp" | "recent" | "name" | "status" | "source">(
    "nextFollowUp",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [formState, setFormState] = useState(emptyForm);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    updated: number;
    totalLeads: number;
    duplicatePhones: string[];
    sampleLeads: Array<{
      fullName: string;
      phone: string;
      source: LeadSource;
      status: LeadStatus;
    }>;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads
      .filter((lead) => {
        const matchesQuery =
          !normalized ||
          [lead.fullName, lead.phone, lead.goal, lead.source, lead.status, lead.assignedTo, lead.note]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesStatus = statusFilter === "All statuses" || lead.status === statusFilter;
        const matchesSource = sourceFilter === "All sources" || lead.source === sourceFilter;

        return matchesQuery && matchesStatus && matchesSource;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.fullName.localeCompare(b.fullName);
          case "source":
            return a.source.localeCompare(b.source) || a.fullName.localeCompare(b.fullName);
          case "status":
            return a.status.localeCompare(b.status) || a.fullName.localeCompare(b.fullName);
          case "recent":
            return b.nextFollowUp.localeCompare(a.nextFollowUp);
          case "nextFollowUp":
          default:
            return a.nextFollowUp.localeCompare(b.nextFollowUp);
        }
      });
  }, [leads, query, sourceFilter, statusFilter, sortBy]);

  const filteredExportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("search", query.trim());
    }

    if (statusFilter !== "All statuses") {
      params.set("status", statusFilter);
    }

    if (sourceFilter !== "All sources") {
      params.set("source", sourceFilter);
    }

    params.set("sort", sortBy);

    return `/api/admin/crm/export?${params.toString()}`;
  }, [query, sortBy, sourceFilter, statusFilter]);

  function resetForm() {
    setFormState(emptyForm);
  }

  async function handleDownload(url: string) {
    window.location.href = url;
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!importFile) {
      setStatusMessage("Please choose a leads Excel file first.");
      return;
    }

    setIsImporting(true);
    setStatusMessage("");
    setImportSummary(null);

    const formData = new FormData();
    formData.append("file", importFile);

    const response = await fetch("/api/admin/crm/import", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      duplicatePhones?: string[];
      sampleLeads?: Array<{
        fullName: string;
        phone: string;
        source: LeadSource;
        status: LeadStatus;
      }>;
      saved?: {
        imported: number;
        updated: number;
        totalLeads: number;
      };
      leads?: LeadRecord[];
    };

    if (!response.ok || !payload.saved || !payload.leads) {
      setStatusMessage(payload.error ?? "Lead import failed.");
      setIsImporting(false);
      return;
    }

    setLeads(payload.leads);
    setImportSummary({
      imported: payload.saved.imported,
      updated: payload.saved.updated,
      totalLeads: payload.saved.totalLeads,
      duplicatePhones: payload.duplicatePhones ?? [],
      sampleLeads: payload.sampleLeads ?? [],
    });
    setImportFile(null);
    setStatusMessage(payload.message ?? "Leads workbook imported.");
    setIsImporting(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/crm", {
      method: formState.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      lead?: LeadRecord;
    };

    if (!response.ok || !payload.lead) {
      setStatusMessage(payload.error ?? "Lead save failed.");
      setIsSubmitting(false);
      return;
    }

    setLeads((current) =>
      formState.id
        ? current.map((lead) => (lead.id === payload.lead?.id ? payload.lead : lead))
        : [payload.lead!, ...current],
    );
    setStatusMessage(payload.message ?? (formState.id ? "Lead updated." : "Lead created."));
    resetForm();
    setIsSubmitting(false);
  }

  function handleEdit(lead: LeadRecord) {
    setFormState({
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      goal: lead.goal,
      source: lead.source,
      status: lead.status,
      assignedTo: lead.assignedTo,
      nextFollowUp: lead.nextFollowUp,
      note: lead.note,
    });
    setStatusMessage(`Editing ${lead.fullName}`);
  }

  async function handleDelete(id: string) {
    setIsDeleting(id);
    setStatusMessage("");

    const response = await fetch("/api/admin/crm", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setStatusMessage(payload.error ?? "Lead delete failed.");
      setIsDeleting(null);
      return;
    }

    setLeads((current) => current.filter((lead) => lead.id !== id));
    if (formState.id === id) {
      resetForm();
    }
    setStatusMessage(payload.message ?? "Lead deleted.");
    setIsDeleting(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-orange-600">Bulk lead upload</p>
            <h3 className="mt-2 font-serif text-2xl text-slate-950">Add multiple leads from Excel</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Download the sample file, fill in your leads, and upload them to the CRM in one go.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleDownload(filteredExportUrl)}
              className="rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-medium text-orange-700"
            >
              Export current leads view
            </button>
            <button
              type="button"
              onClick={() => handleDownload("/api/admin/crm/template")}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Download sample file
            </button>
          </div>
        </div>

        <form onSubmit={handleImport} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Leads Excel file
            <input
              type="file"
              accept=".xlsx"
              onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            />
          </label>
          <button
            type="submit"
            disabled={isImporting}
            className="rounded-full bg-orange-500 px-5 py-3 text-sm font-medium text-slate-950 disabled:opacity-60"
          >
            {isImporting ? "Importing..." : "Import leads"}
          </button>
        </form>

        {importSummary ? (
          <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <span>Imported: {importSummary.imported}</span>
              <span>Updated: {importSummary.updated}</span>
              <span>Total leads: {importSummary.totalLeads}</span>
            </div>
            {importSummary.duplicatePhones.length > 0 ? (
              <p className="mt-3 text-sm text-amber-700">
                Duplicate phones in file: {importSummary.duplicatePhones.join(", ")}
              </p>
            ) : null}
            {importSummary.sampleLeads.length > 0 ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {importSummary.sampleLeads.map((lead) => (
                  <div key={`${lead.phone}-${lead.fullName}`} className="rounded-2xl bg-white p-3">
                    <p className="font-medium text-slate-950">{lead.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.phone}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-orange-600">
                      {lead.source}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{lead.status}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(7,24,39,0.08)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-2xl text-slate-950">
            {formState.id ? "Edit lead" : "Add lead"}
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
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Lead name"
            value={formState.fullName}
            onChange={(event) => setFormState((current) => ({ ...current, fullName: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Phone"
            value={formState.phone}
            onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
          />
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:col-span-2"
            placeholder="Goal"
            value={formState.goal}
            onChange={(event) => setFormState((current) => ({ ...current, goal: event.target.value }))}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={formState.source}
            onChange={(event) =>
              setFormState((current) => ({ ...current, source: event.target.value as LeadSource }))
            }
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={formState.status}
            onChange={(event) =>
              setFormState((current) => ({ ...current, status: event.target.value as LeadStatus }))
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Assigned to"
            value={formState.assignedTo}
            onChange={(event) =>
              setFormState((current) => ({ ...current, assignedTo: event.target.value }))
            }
          />
          <input
            type="date"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={formState.nextFollowUp}
            onChange={(event) =>
              setFormState((current) => ({ ...current, nextFollowUp: event.target.value }))
            }
          />
          <textarea
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm lg:col-span-2"
            rows={3}
            placeholder="Notes"
            value={formState.note}
            onChange={(event) => setFormState((current) => ({ ...current, note: event.target.value }))}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{statusMessage}</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          >
            {isSubmitting ? "Saving..." : formState.id ? "Save lead" : "Create lead"}
          </button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by lead name, goal, source, or coach..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "All statuses")}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="All statuses">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as LeadSource | "All sources")}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="All sources">All sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value as "nextFollowUp" | "recent" | "name" | "status" | "source")
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="nextFollowUp">Sort: Next follow-up</option>
          <option value="recent">Sort: Latest follow-up</option>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
          <option value="source">Sort: Source</option>
        </select>
      </div>

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
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(lead)}
                        className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lead.id)}
                        disabled={isDeleting === lead.id}
                        className="rounded-full bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                      >
                        {isDeleting === lead.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
