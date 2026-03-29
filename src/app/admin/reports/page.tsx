import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { formatInr, getReportsSnapshot } from "@/lib/reporting";

export default async function AdminReportsPage() {
  const snapshot = await getReportsSnapshot();

  return (
    <AppShell
      role="admin"
      title="Reports dashboard"
      subtitle="Track member growth, trainer workload, sales, forms, diet adherence, and lead conversions from one analytics workspace."
      navLinks={adminNavLinks}
    >
      <div className="flex flex-wrap justify-end gap-3">
        <a
          href="/api/admin/reports/export"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
        >
          Download reports Excel
        </a>
        <Link
          href="/admin/reports/print"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Open PDF report view
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={String(snapshot.members.length)}
          detail="Total active member records available for reporting."
        />
        <StatCard
          label="Attendance"
          value={String(snapshot.presentCount)}
          detail="Clients marked present across tracked classes."
        />
        <StatCard
          label="Revenue"
          value={formatInr(snapshot.collectedRevenue)}
          detail="Collected revenue from paid invoices."
        />
        <StatCard
          label="Lead conversions"
          value={String(snapshot.leadStats.converted)}
          detail="Converted inquiries from the current CRM funnel."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SectionCard eyebrow="Growth" title="Member growth trend">
          <div className="space-y-4">
            {snapshot.memberGrowth.map((row) => (
              <div key={row.month}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                  <span>{row.month}</span>
                  <span>{row.count} new members</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-orange-500"
                    style={{ width: `${(row.count / snapshot.maxGrowthCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Attendance" title="Class attendance overview">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-emerald-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-emerald-700">Present</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-900">{snapshot.presentCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Booked</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{snapshot.bookedCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-rose-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-rose-700">Absent</p>
              <p className="mt-3 text-3xl font-semibold text-rose-900">{snapshot.absentCount}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.data.sessions.map((session) => {
              const present = snapshot.data.attendance.filter(
                (entry) => entry.sessionId === session.id && entry.status === "Checked In",
              ).length;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{session.title}</p>
                    <p className="text-sm text-slate-500">
                      {session.day} · {session.time}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {present}/{session.capacity} present
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SectionCard eyebrow="Billing" title="Revenue and collections">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Collected</p>
              <p className="mt-3 text-3xl font-semibold">{formatInr(snapshot.collectedRevenue)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-amber-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-amber-700">Outstanding</p>
              <p className="mt-3 text-3xl font-semibold text-amber-900">
                {formatInr(snapshot.outstandingRevenue)}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-rose-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-rose-700">Overdue</p>
              <p className="mt-3 text-3xl font-semibold text-rose-900">{snapshot.overdueInvoices}</p>
            </div>
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
              Inventory margin snapshot
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatInr(snapshot.estimatedInventoryMargin)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Estimated profit generated from recorded supplement sales.
            </p>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Forms" title="Form performance">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Active forms</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{snapshot.forms.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-orange-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-orange-700">Responses</p>
              <p className="mt-3 text-3xl font-semibold text-orange-900">{snapshot.responses.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-emerald-700">Top form</p>
              <p className="mt-3 text-lg font-semibold text-emerald-900">
                {snapshot.topFormResponses[0]?.title ?? "-"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.topFormResponses.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-3"
              >
                <p className="font-semibold text-slate-950">{form.title}</p>
                <p className="text-sm font-medium text-slate-700">
                  {form.responses} response(s)
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SectionCard eyebrow="Team" title="Trainer workload">
          <div className="space-y-3">
            {snapshot.trainerRows.map((trainer) => (
              <div
                key={trainer.id}
                className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-950">{trainer.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {trainer.activePlans} active plans · {trainer.classes} classes
                  </p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  Trainer
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Leads + diet" title="Growth funnel">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">New leads</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{snapshot.leadStats.new}</p>
            </div>
            <div className="rounded-[1.5rem] bg-orange-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-orange-700">Trial booked</p>
              <p className="mt-3 text-3xl font-semibold text-orange-900">{snapshot.leadStats.activeTrials}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-emerald-700">Converted</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-900">{snapshot.leadStats.converted}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Diet adherence</p>
              <p className="mt-3 text-3xl font-semibold">{Math.round(snapshot.avgDietAdherence)}%</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-950">{lead.fullName}</p>
                  <p className="text-sm text-slate-500">{lead.source} · {lead.assignedTo}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
