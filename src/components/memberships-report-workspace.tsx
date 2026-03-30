"use client";

import { useMemo, useState } from "react";

import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { Membership, Profile } from "@/lib/types";

type MembershipsReportWorkspaceProps = {
  profiles: Profile[];
  memberships: Membership[];
};

export function MembershipsReportWorkspace({
  profiles,
  memberships,
}: MembershipsReportWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Membership["status"] | "All statuses">("All statuses");
  const [paymentFilter, setPaymentFilter] = useState<
    Membership["paymentStatus"] | "All payment statuses"
  >("All payment statuses");
  const [branchFilter, setBranchFilter] = useState("All branches");
  const [sortBy, setSortBy] = useState<"renewalSoon" | "outstandingHigh" | "name" | "branch">(
    "renewalSoon",
  );

  const branchOptions = useMemo(
    () =>
      Array.from(
        new Set(
          profiles
            .filter((profile) => profile.role === "member")
            .map((profile) => profile.branch)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [profiles],
  );

  const filteredMemberships = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return memberships
      .map((membership) => ({
        membership,
        member: profiles.find((entry) => entry.id === membership.memberId),
      }))
      .filter(({ membership, member }) => {
        const matchesSearch =
          !normalized ||
          [
            member?.fullName ?? "",
            member?.email ?? "",
            member?.branch ?? "",
            membership.planName,
            membership.paymentMethod,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesStatus = statusFilter === "All statuses" || membership.status === statusFilter;
        const matchesPayment =
          paymentFilter === "All payment statuses" || membership.paymentStatus === paymentFilter;
        const matchesBranch = branchFilter === "All branches" || member?.branch === branchFilter;

        return matchesSearch && matchesStatus && matchesPayment && matchesBranch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "outstandingHigh":
            return (
              b.membership.outstandingAmountInr - a.membership.outstandingAmountInr ||
              (a.member?.fullName ?? "").localeCompare(b.member?.fullName ?? "")
            );
          case "name":
            return (a.member?.fullName ?? "").localeCompare(b.member?.fullName ?? "");
          case "branch":
            return (
              (a.member?.branch ?? "").localeCompare(b.member?.branch ?? "") ||
              (a.member?.fullName ?? "").localeCompare(b.member?.fullName ?? "")
            );
          case "renewalSoon":
          default:
            return a.membership.renewalDate.localeCompare(b.membership.renewalDate);
        }
      });
  }, [branchFilter, memberships, paymentFilter, profiles, searchQuery, sortBy, statusFilter]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (statusFilter !== "All statuses") params.set("status", statusFilter);
    if (paymentFilter !== "All payment statuses") params.set("paymentStatus", paymentFilter);
    if (branchFilter !== "All branches") params.set("branch", branchFilter);
    params.set("sort", sortBy);

    return `/api/admin/memberships/export?${params.toString()}`;
  }, [branchFilter, paymentFilter, searchQuery, sortBy, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by member, email, branch, plan, or payment method"
          className="min-w-[16rem] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as Membership["status"] | "All statuses")}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="All statuses">All statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="On Hold">On Hold</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(event) =>
            setPaymentFilter(
              event.target.value as Membership["paymentStatus"] | "All payment statuses",
            )
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="All payment statuses">All payment statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
          <option value="Partially Paid">Partially Paid</option>
        </select>
        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="All branches">All branches</option>
          {branchOptions.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value as "renewalSoon" | "outstandingHigh" | "name" | "branch")
          }
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="renewalSoon">Sort: Renewal soon</option>
          <option value="outstandingHigh">Sort: Highest outstanding</option>
          <option value="name">Sort: Name</option>
          <option value="branch">Sort: Branch</option>
        </select>
        <a
          href={exportUrl}
          className="rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700"
        >
          Export current view
        </a>
      </div>

      <div className="space-y-4">
        {filteredMemberships.map(({ membership, member }) => (
          <div key={membership.id} className="rounded-[1.5rem] border border-slate-200 p-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{member?.fullName}</p>
                <p className="text-sm text-slate-600">
                  {membership.planName} · {membership.billingCycle}
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
              <p>Active from {membership.startDate} until {membership.renewalDate}</p>
              <p>Last payment {membership.lastPaymentDate} · Next invoice {membership.nextInvoiceDate}</p>
              <p>
                Amount INR {membership.amountInr} · Outstanding INR {membership.outstandingAmountInr} ·{" "}
                {membership.paymentMethod}
              </p>
            </div>
          </div>
        ))}
        {filteredMemberships.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-5 text-sm text-slate-500">
            No memberships match the current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
