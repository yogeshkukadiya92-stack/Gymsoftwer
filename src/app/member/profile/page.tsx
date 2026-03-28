import { AppShell } from "@/components/app-shell";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { SectionCard } from "@/components/section-card";
import { getDashboardData } from "@/lib/data";

const navLinks = [
  { href: "/member", label: "Overview" },
  { href: "/member/workouts", label: "Workouts" },
  { href: "/member/progress", label: "Progress" },
  { href: "/member/schedule", label: "Schedule" },
  { href: "/member/profile", label: "Profile" },
];

export default async function MemberProfilePage() {
  const { viewer, data } = await getDashboardData("member");
  const membership = data.memberships.find((entry) => entry.memberId === viewer.id);

  return (
    <AppShell
      role="member"
      title="Profile and membership"
      subtitle="Personal details, goals, and membership state are surfaced in one place."
      navLinks={navLinks}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard eyebrow="Profile" title={viewer.fullName}>
          <dl className="grid gap-4 text-slate-700">
            <div>
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="font-medium text-slate-950">{viewer.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Phone</dt>
              <dd className="font-medium text-slate-950">{viewer.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Goal</dt>
              <dd className="font-medium text-slate-950">{viewer.fitnessGoal}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Branch</dt>
              <dd className="font-medium text-slate-950">{viewer.branch}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard eyebrow="Membership" title={membership?.planName ?? "No plan found"}>
          <dl className="grid gap-4 text-slate-700">
            <div>
              <dt className="text-sm text-slate-500">Status</dt>
              <dd className="font-medium text-slate-950">{membership?.status ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Payment</dt>
              <dd className="mt-1">
                {membership ? (
                  <PaymentStatusBadge status={membership.paymentStatus} />
                ) : (
                  "Unavailable"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Start date</dt>
              <dd className="font-medium text-slate-950">{membership?.startDate ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Renewal date</dt>
              <dd className="font-medium text-slate-950">{membership?.renewalDate ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Billing cycle</dt>
              <dd className="font-medium text-slate-950">{membership?.billingCycle ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Amount</dt>
              <dd className="font-medium text-slate-950">
                {membership ? `INR ${membership.amountInr}` : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Outstanding</dt>
              <dd className="font-medium text-slate-950">
                {membership ? `INR ${membership.outstandingAmountInr}` : "-"}
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </AppShell>
  );
}
