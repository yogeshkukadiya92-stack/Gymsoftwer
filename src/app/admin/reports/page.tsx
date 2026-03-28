import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
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
  const [data, forms, responses] = await Promise.all([
    getAppData(),
    getAllForms(),
    getAllFormResponses(),
  ]);

  const members = data.profiles.filter((profile) => profile.role === "member");
  const memberGrowth = getMemberGrowthRows(members.map((member) => member.joinedOn));
  const maxGrowthCount = Math.max(...memberGrowth.map((item) => item.count), 1);

  const presentCount = data.attendance.filter(
    (entry) => entry.status === "Checked In",
  ).length;
  const absentCount = data.attendance.filter(
    (entry) => entry.status === "Missed",
  ).length;
  const bookedCount = data.attendance.filter(
    (entry) => entry.status === "Booked",
  ).length;

  const collectedRevenue = data.invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amountInr, 0);
  const outstandingRevenue = data.memberships.reduce(
    (sum, membership) => sum + membership.outstandingAmountInr,
    0,
  );
  const overdueInvoices = data.invoices.filter(
    (invoice) => invoice.status === "Overdue",
  ).length;

  const formSummary = forms.map((form) => ({
    id: form.id,
    title: form.title,
    responses: responses.filter((response) => response.formId === form.id).length,
  }));

  const topFormResponses = [...formSummary].sort((a, b) => b.responses - a.responses);

  return (
    <AppShell
      role="admin"
      title="Reports dashboard"
      subtitle="Track member growth, attendance performance, billing health, and form activity from one analytics workspace."
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
          label="Form responses"
          value={String(responses.length)}
          detail="Total submitted form responses across all forms."
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
                (entry) =>
                  entry.sessionId === session.id && entry.status === "Checked In",
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
          <div className="mt-5 space-y-3">
            {data.invoices.map((invoice) => {
              const member = data.profiles.find((profile) => profile.id === invoice.memberId);

              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-slate-500">{member?.fullName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-slate-900">{formatInr(invoice.amountInr)}</p>
                    <p className="text-slate-500">{invoice.status}</p>
                  </div>
                </div>
              );
            })}
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
              <p className="mt-3 text-3xl font-semibold text-orange-900">
                {responses.length}
              </p>
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
    </AppShell>
  );
}
