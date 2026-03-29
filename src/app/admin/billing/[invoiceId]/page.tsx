import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { SectionCard } from "@/components/section-card";
import { adminNavLinks } from "@/lib/admin-nav";
import { getAppData } from "@/lib/data";

function formatInr(value: number) {
  return `INR ${value}`;
}

export default async function AdminInvoiceViewPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const data = await getAppData();
  const invoice = data.invoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    notFound();
  }

  const member = data.profiles.find((profile) => profile.id === invoice.memberId);
  const membership = data.memberships.find((item) => item.id === invoice.membershipId);

  return (
    <AppShell
      role="admin"
      title={invoice.invoiceNumber}
      subtitle="Detailed invoice view for member billing, payment method, and outstanding status."
      navLinks={adminNavLinks}
    >
      <SectionCard eyebrow="Invoice view" title="Invoice details">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{member?.fullName ?? "Unknown member"}</p>
            <p className="mt-1 text-sm text-slate-500">{membership?.planName ?? "No linked plan"}</p>
          </div>
          <div className="flex items-center gap-3">
            <PaymentStatusBadge status={invoice.status} />
            <Link
              href="/admin/billing"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back to billing
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Issued on</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{invoice.issuedOn}</p>
          </div>
          <div className="rounded-[1.25rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Due on</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{invoice.dueOn}</p>
          </div>
          <div className="rounded-[1.25rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Amount</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatInr(invoice.amountInr)}</p>
          </div>
          <div className="rounded-[1.25rem] bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Payment method</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {invoice.paymentMethod ?? "Not recorded"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 p-5">
          <h3 className="font-serif text-2xl text-slate-950">Accounting notes</h3>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <p>Member: {member?.fullName ?? "Unknown member"}</p>
            <p>Email: {member?.email ?? "Not available"}</p>
            <p>Phone: {member?.phone ?? "Not available"}</p>
            <p>
              Payment completion: {invoice.paidOn ? `Paid on ${invoice.paidOn}` : "Payment not completed yet"}
            </p>
            <p>
              Outstanding against membership: {formatInr(membership?.outstandingAmountInr ?? 0)}
            </p>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
