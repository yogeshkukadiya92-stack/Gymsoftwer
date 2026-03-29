import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getDietPlans, getLeadRecords } from "@/lib/business-data-store";
import { getAppData } from "@/lib/data";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";

function formatInr(value: number) {
  return `INR ${value}`;
}

function getMemberGrowthRows(joinDates: string[]) {
  const counts = new Map<string, number>();

  joinDates.forEach((date) => {
    const monthKey = date.slice(0, 7);
    counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export default async function AdminReportsPage() {
  const [data, forms, responses, starterDietPlans, starterLeads] = await Promise.all([
    getAppData(),
    getAllForms(),
    getAllFormResponses(),
    getDietPlans(),
    getLeadRecords(),
  ]);

  const members = data.profiles.filter((profile) => profile.role === "member");
  const memberGrowth = getMemberGrowthRows(members.map((member) => member.joinedOn));
  const maxGrowthCount = Math.max(...memberGrowth.map((item) => item.count), 1);

  const presentCount = data.attendance.filter((entry) => entry.status === "Checked In").length;
  const absentCount = data.attendance.filter((entry) => entry.status === "Missed").length;
  const bookedCount = data.attendance.filter((entry) => entry.status === "Booked").length;

  const collectedRevenue = data.invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amountInr, 0);
  const outstandingRevenue = data.memberships.reduce(
    (sum, membership) => sum + membership.outstandingAmountInr,
    0,
  );
  const overdueInvoices = data.invoices.filter((invoice) => invoice.status === "Overdue").length;

  const estimatedInventoryMargin = data.inventorySales.reduce((sum, sale) => {
    const item = data.inventoryItems.find((inventoryItem) => inventoryItem.id === sale.itemId);
    if (!item) {
      return sum;
    }
    return sum + (sale.totalAmountInr - item.costPriceInr * sale.quantity);
  }, 0);

  const formSummary = forms.map((form) => ({
    id: form.id,
    title: form.title,
    responses: responses.filter((response) => response.formId === form.id).length,
  }));
  const topFormResponses = [...formSummary].sort((a, b) => b.responses - a.responses);

  const trainers = data.profiles.filter((profile) => profile.role === "trainer");
  const trainerRows = trainers.map((trainer) => ({
    id: trainer.id,
    fullName: trainer.fullName,
    activePlans: data.workoutPlans.filter((plan) => plan.coach === trainer.fullName).length,
    classes: data.sessions.filter((session) => session.coach === trainer.fullName).length,
  }));

  const leadStats = {
    total: starterLeads.length,
    converted: starterLeads.filter((lead) => lead.status === "Converted").length,
    activeTrials: starterLeads.filter((lead) => lead.status === "Trial Booked").length,
    new: starterLeads.filter((lead) => lead.status === "New").length,
  };

  const avgDietAdherence =
    starterDietPlans.length > 0
      ? starterDietPlans.reduce((sum, plan) => sum + plan.adherence, 0) /
        starterDietPlans.length
      : 0;

  return (
    <AppShell
      role="admin"
      title="Reports dashboard"
      subtitle="Track member growth, trainer workload, sales, forms, diet adherence, and lead conversions from one analytics workspace."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Members"
          value={String(members.length)}
          detail="Total active member records available for reporting."
        />
        <StatCard
          label="Attendance"
          value={String(presentCount)}
          detail="Clients marked present across tracked classes."
        />
        <StatCard
          label="Revenue"
          value={formatInr(collectedRevenue)}
          detail="Collected revenue from paid invoices."
        />
        <StatCard
          label="Lead conversions"
          value={String(leadStats.converted)}
          detail="Converted inquiries from the current CRM funnel."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SectionCard eyebrow="Growth" title="Member growth trend">
          <div className="space-y-4">
            {memberGrowth.map((row) => (
              <div key={row.month}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                  <span>{row.month}</span>
                  <span>{row.count} new members</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-orange-500"
                    style={{ width: `${(row.count / maxGrowthCount) * 100}%` }}
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
              <p className="mt-3 text-3xl font-semibold text-emerald-900">{presentCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Booked</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{bookedCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-rose-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-rose-700">Absent</p>
              <p className="mt-3 text-3xl font-semibold text-rose-900">{absentCount}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {data.sessions.map((session) => {
              const present = data.attendance.filter(
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
                      {session.day} • {session.time}
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
              <p className="mt-3 text-3xl font-semibold">{formatInr(collectedRevenue)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-amber-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-amber-700">Outstanding</p>
              <p className="mt-3 text-3xl font-semibold text-amber-900">
                {formatInr(outstandingRevenue)}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-rose-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-rose-700">Overdue</p>
              <p className="mt-3 text-3xl font-semibold text-rose-900">{overdueInvoices}</p>
            </div>
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
              Inventory margin snapshot
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatInr(estimatedInventoryMargin)}
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
              <p className="mt-3 text-3xl font-semibold text-slate-900">{forms.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-orange-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-orange-700">Responses</p>
              <p className="mt-3 text-3xl font-semibold text-orange-900">{responses.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-emerald-700">Top form</p>
              <p className="mt-3 text-lg font-semibold text-emerald-900">
                {topFormResponses[0]?.title ?? "-"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {topFormResponses.map((form) => (
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
            {trainerRows.map((trainer) => (
              <div
                key={trainer.id}
                className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-950">{trainer.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {trainer.activePlans} active plans • {trainer.classes} classes
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
              <p className="mt-3 text-3xl font-semibold text-slate-900">{leadStats.new}</p>
            </div>
            <div className="rounded-[1.5rem] bg-orange-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-orange-700">Trial booked</p>
              <p className="mt-3 text-3xl font-semibold text-orange-900">{leadStats.activeTrials}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-emerald-700">Converted</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-900">{leadStats.converted}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Diet adherence</p>
              <p className="mt-3 text-3xl font-semibold">{Math.round(avgDietAdherence)}%</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {starterLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-950">{lead.fullName}</p>
                  <p className="text-sm text-slate-500">{lead.source} • {lead.assignedTo}</p>
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
