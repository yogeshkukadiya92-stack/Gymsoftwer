import { AppShell } from "@/components/app-shell";
import { MembershipsReportWorkspace } from "@/components/memberships-report-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminMembershipsPage() {
  const data = await getAppData();
  const totalOutstanding = data.memberships.reduce(
    (sum, membership) => sum + membership.outstandingAmountInr,
    0,
  );
  const paidCount = data.memberships.filter(
    (membership) => membership.paymentStatus === "Paid",
  ).length;
  const pendingCount = data.memberships.filter(
    (membership) => membership.paymentStatus === "Pending",
  ).length;
  const overdueCount = data.memberships.filter(
    (membership) => membership.paymentStatus === "Overdue",
  ).length;

  return (
    <AppShell
      role="admin"
      title="Membership operations"
      subtitle="Track renewals, payment status, and outstanding billing while keeping membership records organized."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Paid"
          value={String(paidCount)}
          detail="Memberships fully paid in the current cycle."
        />
        <StatCard
          label="Pending"
          value={String(pendingCount)}
          detail="Memberships awaiting payment confirmation."
        />
        <StatCard
          label="Overdue"
          value={String(overdueCount)}
          detail="Memberships that need follow-up immediately."
        />
        <StatCard
          label="Outstanding"
          value={`INR ${totalOutstanding}`}
          detail="Total unpaid balance across memberships."
        />
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Retention" title="Current memberships">
          <MembershipsReportWorkspace
            profiles={data.profiles}
            memberships={data.memberships}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
