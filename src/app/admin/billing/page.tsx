import { AppShell } from "@/components/app-shell";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

export default async function AdminBillingPage() {
  const data = await getAppData();
  const totalOutstanding = data.memberships.reduce(
    (sum, membership) => sum + membership.outstandingAmountInr,
    0,
  );
  const paidInvoices = data.invoices.filter((invoice) => invoice.status === "Paid");
  const overdueInvoices = data.invoices.filter((invoice) => invoice.status === "Overdue");
  const collectedRevenue = paidInvoices.reduce(
    (sum, invoice) => sum + invoice.amountInr,
    0,
  );

  return (
    <AppShell
      role="admin"
      title="Billing and invoices"
      subtitle="Track payment status, renewal billing, outstanding balances, and invoice history from one place."
      navLinks={adminNavLinks}
    >
      <div className="grid gap-6 lg:grid-cols-4">
        <StatCard
          label="Collected"
          value={`INR ${collectedRevenue}`}
          detail="Revenue collected from paid invoices in the current view."
        />
        <StatCard
          label="Outstanding"
          value={`INR ${totalOutstanding}`}
          detail="Pending and overdue balance still to be collected."
        />
        <StatCard
          label="Paid invoices"
          value={String(paidInvoices.length)}
          detail="Invoices fully paid by members."
        />
        <StatCard
          label="Overdue"
          value={String(overdueInvoices.length)}
          detail="Invoices requiring urgent follow-up."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <SectionCard eyebrow="Renewals" title="Upcoming invoice schedule">
          <div className="space-y-4">
            {data.memberships.map((membership) => {
              const member = data.profiles.find((profile) => profile.id === membership.memberId);

              return (
                <div key={membership.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{member?.fullName}</p>
                      <p className="text-sm text-slate-600">
                        {membership.planName} • {membership.billingCycle}
                      </p>
                    </div>
                    <PaymentStatusBadge status={membership.paymentStatus} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Next invoice {membership.nextInvoiceDate} • Outstanding INR{" "}
                    {membership.outstandingAmountInr}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard eyebrow="History" title="Invoice records">
          <div className="space-y-4">
            {data.invoices.map((invoice) => {
              const member = data.profiles.find((profile) => profile.id === invoice.memberId);

              return (
                <div key={invoice.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-slate-600">{member?.fullName}</p>
                    </div>
                    <PaymentStatusBadge status={invoice.status} />
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-500">
                    <p>
                      Issued {invoice.issuedOn} • Due {invoice.dueOn}
                    </p>
                    <p>
                      Amount INR {invoice.amountInr}
                      {invoice.paymentMethod ? ` • ${invoice.paymentMethod}` : ""}
                    </p>
                    <p>{invoice.paidOn ? `Paid on ${invoice.paidOn}` : "Payment not yet completed"}</p>
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
