import { AppShell } from "@/components/app-shell";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
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
        <div className="space-y-4">
          {data.memberships.map((membership) => {
            const member = data.profiles.find((entry) => entry.id === membership.memberId);

            return (
              <div key={membership.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{member?.fullName}</p>
                    <p className="text-sm text-slate-600">
                      {membership.planName} • {membership.billingCycle}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                      {membership.status}
                    </span>
                    <PaymentStatusBadge status={membership.paymentStatus} />
                  </div>
                </div>
                <div className="mt-3 grid gap-1 text-sm text-slate-500">
                  <p>
                    Active from {membership.startDate} until {membership.renewalDate}
                  </p>
                  <p>
                    Last payment {membership.lastPaymentDate} • Next invoice{" "}
                    {membership.nextInvoiceDate}
                  </p>
                  <p>
                    Amount INR {membership.amountInr} • Outstanding INR{" "}
                    {membership.outstandingAmountInr} • {membership.paymentMethod}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
      </div>
    </AppShell>
  );
}
