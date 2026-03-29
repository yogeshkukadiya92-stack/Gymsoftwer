import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
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

  const memberAccounting = data.profiles
    .filter((profile) => profile.role === "member")
    .map((profile) => {
      const invoices = data.invoices.filter((invoice) => invoice.memberId === profile.id);
      const memberships = data.memberships.filter((membership) => membership.memberId === profile.id);
      const collected = invoices
        .filter((invoice) => invoice.status === "Paid")
        .reduce((sum, invoice) => sum + invoice.amountInr, 0);
      const outstanding = memberships.reduce(
        (sum, membership) => sum + membership.outstandingAmountInr,
        0,
      );

      return {
        member: profile,
        collected,
        outstanding,
        invoices,
        memberships,
      };
    })
    .sort((left, right) => right.outstanding - left.outstanding);

  return (
    <AppShell
      role="admin"
      title="Billing and invoices"
      subtitle="Track collections, outstanding balances, invoice history, and user-wise accounting from one place."
      navLinks={adminNavLinks}
    >
      <div className="flex flex-wrap justify-end gap-3">
        <a
          href="/api/admin/billing/export"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
        >
          Export billing report Excel
        </a>
      </div>

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <SectionCard eyebrow="Accounting" title="Collections overview">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Money collected</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatInr(collectedRevenue)}</p>
              <p className="mt-2 text-sm text-slate-500">{paidInvoices.length} paid invoice(s)</p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Money outstanding</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatInr(totalOutstanding)}</p>
              <p className="mt-2 text-sm text-slate-500">
                {pendingInvoices.length + overdueInvoices.length} invoice(s) still open
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {data.memberships.map((membership) => {
              const member = data.profiles.find((profile) => profile.id === membership.memberId);

              return (
                <div key={membership.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{member?.fullName}</p>
                      <p className="text-sm text-slate-600">
                        {membership.planName} · {membership.billingCycle}
                      </p>
                    </div>
                    <PaymentStatusBadge status={membership.paymentStatus} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Next invoice {membership.nextInvoiceDate} · Outstanding {formatInr(membership.outstandingAmountInr)}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Invoices" title="Invoice records">
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
                    <div className="flex items-center gap-3">
                      <PaymentStatusBadge status={invoice.status} />
                      <Link
                        href={`/admin/billing/${invoice.id}`}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
                      >
                        View invoice
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-500">
                    <p>
                      Issued {invoice.issuedOn} · Due {invoice.dueOn}
                    </p>
                    <p>
                      Amount {formatInr(invoice.amountInr)}
                      {invoice.paymentMethod ? ` · ${invoice.paymentMethod}` : ""}
                    </p>
                    <p>{invoice.paidOn ? `Paid on ${invoice.paidOn}` : "Payment not yet completed"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard eyebrow="Member-wise" title="User-wise accounting report">
          <div className="space-y-4">
            {memberAccounting.map((entry) => (
              <div key={entry.member.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{entry.member.fullName}</p>
                    <p className="text-sm text-slate-600">
                      {entry.member.email} · {entry.member.branch || "No branch"}
                    </p>
                  </div>
                  <div className="grid gap-2 text-right text-sm text-slate-600">
                    <p>Collected: {formatInr(entry.collected)}</p>
                    <p>Outstanding: {formatInr(entry.outstanding)}</p>
                    <p>Invoices: {entry.invoices.length}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Paid</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {entry.invoices.filter((invoice) => invoice.status === "Paid").length}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Pending</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {entry.invoices.filter((invoice) => invoice.status === "Pending").length}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Overdue</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {entry.invoices.filter((invoice) => invoice.status === "Overdue").length}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
