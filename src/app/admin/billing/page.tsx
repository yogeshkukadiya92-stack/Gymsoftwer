import { AppShell } from "@/components/app-shell";
import { BillingReportWorkspace } from "@/components/billing-report-workspace";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

function formatInr(value: number) {
  return `INR ${value}`;
}

export default async function AdminBillingPage() {
  const data = await getAppData();
  const totalOutstanding = data.memberships.reduce(
    (sum, membership) => sum + membership.outstandingAmountInr,
    0,
  );
  const paidInvoices = data.invoices.filter((invoice) => invoice.status === "Paid");
  const pendingInvoices = data.invoices.filter((invoice) => invoice.status === "Pending");
  const overdueInvoices = data.invoices.filter((invoice) => invoice.status === "Overdue");
  const collectedRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amountInr, 0);
  const totalInvoiced = data.invoices.reduce((sum, invoice) => sum + invoice.amountInr, 0);

  return (
    <AppShell
      role="admin"
      title="Billing and invoices"
      subtitle="Track collections, outstanding balances, invoice history, and user-wise accounting from one place."
      navLinks={adminNavLinks}
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <StatCard
          label="Collected"
          value={formatInr(collectedRevenue)}
          detail="Revenue collected from paid invoices."
        />
        <StatCard
          label="Outstanding"
          value={formatInr(totalOutstanding)}
          detail="Pending and overdue balance still to be collected."
        />
        <StatCard
          label="Total invoiced"
          value={formatInr(totalInvoiced)}
          detail="Total value of all generated invoices."
        />
        <StatCard
          label="Pending invoices"
          value={String(pendingInvoices.length)}
          detail="Invoices waiting for payment confirmation."
        />
        <StatCard
          label="Overdue"
          value={String(overdueInvoices.length)}
          detail="Invoices requiring urgent follow-up."
        />
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Accounting" title="Billing workspace">
          <BillingReportWorkspace
            profiles={data.profiles}
            memberships={data.memberships}
            invoices={data.invoices}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
