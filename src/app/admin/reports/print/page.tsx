import { AppShell } from "@/components/app-shell";
import { ReportPrintActions } from "@/components/report-print-actions";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { formatInr, getReportsSnapshot } from "@/lib/reporting";

export default async function AdminReportsPrintPage() {
  const snapshot = await getReportsSnapshot();

  return (
    <AppShell
      role="admin"
      title="Reports export view"
      subtitle="Use print to save this dashboard as a PDF report."
      navLinks={adminNavLinks}
    >
      <div className="mb-6">
        <ReportPrintActions />
      </div>

      <div className="grid gap-6">
        <SectionCard eyebrow="Overview" title="Business summary">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Members</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{snapshot.members.length}</p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Collected</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {formatInr(snapshot.collectedRevenue)}
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Outstanding</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {formatInr(snapshot.outstandingRevenue)}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Attendance" title="Attendance report">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Present</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{snapshot.presentCount}</p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Booked</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.bookedCount}</p>
            </div>
            <div className="rounded-[1.25rem] bg-rose-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-rose-700">Absent</p>
              <p className="mt-2 text-2xl font-semibold text-rose-900">{snapshot.absentCount}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Growth" title="Member growth report">
          <div className="space-y-3">
            {snapshot.memberGrowth.map((row) => (
              <div key={row.month} className="flex items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{row.month}</p>
                <p className="text-sm text-slate-600">{row.count} new members</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Forms" title="Form response report">
          <div className="space-y-3">
            {snapshot.topFormResponses.map((form) => (
              <div key={form.id} className="flex items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{form.title}</p>
                <p className="text-sm text-slate-600">{form.responses} responses</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Team" title="Trainer workload report">
          <div className="space-y-3">
            {snapshot.trainerRows.map((trainer) => (
              <div key={trainer.id} className="flex items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-950">{trainer.fullName}</p>
                <p className="text-sm text-slate-600">
                  {trainer.activePlans} plans · {trainer.classes} classes
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Funnel" title="Lead and diet report">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">New leads</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{snapshot.leadStats.new}</p>
            </div>
            <div className="rounded-[1.25rem] bg-orange-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-700">Trials</p>
              <p className="mt-2 text-2xl font-semibold text-orange-900">{snapshot.leadStats.activeTrials}</p>
            </div>
            <div className="rounded-[1.25rem] bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Converted</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{snapshot.leadStats.converted}</p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-950 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Diet adherence</p>
              <p className="mt-2 text-2xl font-semibold">{Math.round(snapshot.avgDietAdherence)}%</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
