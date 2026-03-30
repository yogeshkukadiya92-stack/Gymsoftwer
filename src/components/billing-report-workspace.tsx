"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  FilterToolbar,
  FilterToolbarAction,
  FilterToolbarItem,
  FilterToolbarSearch,
  FilterToolbarSelect,
} from "@/components/filter-toolbar";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { Invoice, Membership, Profile } from "@/lib/types";

type BillingReportWorkspaceProps = {
  profiles: Profile[];
  memberships: Membership[];
  invoices: Invoice[];
};

function formatInr(value: number) {
  return `INR ${value}`;
}

export function BillingReportWorkspace({
  profiles,
  memberships,
  invoices,
}: BillingReportWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<Invoice["status"] | "All invoices">(
    "All invoices",
  );
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<
    Membership["status"] | "All memberships"
  >("All memberships");
  const [branchFilter, setBranchFilter] = useState("All branches");
  const [sortBy, setSortBy] = useState<"outstandingHigh" | "outstandingLow" | "collectedHigh" | "name">(
    "outstandingHigh",
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

  const filteredMembers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return profiles
      .filter((profile) => profile.role === "member")
      .filter((profile) => {
        const matchesSearch =
          !normalized ||
          [profile.fullName, profile.email, profile.phone, profile.branch]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesBranch = branchFilter === "All branches" || profile.branch === branchFilter;

        return matchesSearch && matchesBranch;
      });
  }, [branchFilter, profiles, searchQuery]);

  const filteredMemberIds = useMemo(
    () => new Set(filteredMembers.map((profile) => profile.id)),
    [filteredMembers],
  );

  const filteredMemberships = useMemo(
    () =>
      memberships.filter(
        (membership) =>
          filteredMemberIds.has(membership.memberId) &&
          (membershipStatusFilter === "All memberships" || membership.status === membershipStatusFilter),
      ),
    [filteredMemberIds, membershipStatusFilter, memberships],
  );

  const filteredMembershipIds = useMemo(
    () => new Set(filteredMemberships.map((membership) => membership.id)),
    [filteredMemberships],
  );

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          filteredMemberIds.has(invoice.memberId) &&
          filteredMembershipIds.has(invoice.membershipId) &&
          (invoiceStatusFilter === "All invoices" || invoice.status === invoiceStatusFilter),
      ),
    [filteredMemberIds, filteredMembershipIds, invoiceStatusFilter, invoices],
  );

  const collectedRevenue = filteredInvoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amountInr, 0);
  const totalOutstanding = filteredMemberships.reduce(
    (sum, membership) => sum + membership.outstandingAmountInr,
    0,
  );
  const totalInvoiced = filteredInvoices.reduce((sum, invoice) => sum + invoice.amountInr, 0);
  const pendingInvoices = filteredInvoices.filter((invoice) => invoice.status === "Pending");
  const overdueInvoices = filteredInvoices.filter((invoice) => invoice.status === "Overdue");

  const memberAccounting = useMemo(
    () =>
      filteredMembers
        .map((profile) => {
          const memberInvoices = filteredInvoices.filter((invoice) => invoice.memberId === profile.id);
          const memberMemberships = filteredMemberships.filter(
            (membership) => membership.memberId === profile.id,
          );
          const collected = memberInvoices
            .filter((invoice) => invoice.status === "Paid")
            .reduce((sum, invoice) => sum + invoice.amountInr, 0);
          const outstanding = memberMemberships.reduce(
            (sum, membership) => sum + membership.outstandingAmountInr,
            0,
          );

          return {
            member: profile,
            collected,
            outstanding,
            invoices: memberInvoices,
            memberships: memberMemberships,
          };
        })
        .sort((left, right) => {
          switch (sortBy) {
            case "name":
              return left.member.fullName.localeCompare(right.member.fullName);
            case "collectedHigh":
              return right.collected - left.collected || left.member.fullName.localeCompare(right.member.fullName);
            case "outstandingLow":
              return left.outstanding - right.outstanding || left.member.fullName.localeCompare(right.member.fullName);
            case "outstandingHigh":
            default:
              return right.outstanding - left.outstanding || left.member.fullName.localeCompare(right.member.fullName);
          }
        }),
    [filteredInvoices, filteredMembers, filteredMemberships, sortBy],
  );

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    if (invoiceStatusFilter !== "All invoices") {
      params.set("invoiceStatus", invoiceStatusFilter);
    }
    if (membershipStatusFilter !== "All memberships") {
      params.set("membershipStatus", membershipStatusFilter);
    }
    if (branchFilter !== "All branches") {
      params.set("branch", branchFilter);
    }
    params.set("sort", sortBy);

    return `/api/admin/billing/export?${params.toString()}`;
  }, [branchFilter, invoiceStatusFilter, membershipStatusFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      <FilterToolbar>
        <FilterToolbarItem className="min-w-[16rem] flex-[1.4]">
          <FilterToolbarSearch
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by member, email, phone, or branch"
          />
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
          <option value="All branches">All branches</option>
          {branchOptions.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={membershipStatusFilter}
            onChange={(event) =>
              setMembershipStatusFilter(event.target.value as Membership["status"] | "All memberships")
            }
          >
          <option value="All memberships">All memberships</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="On Hold">On Hold</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={invoiceStatusFilter}
            onChange={(event) =>
              setInvoiceStatusFilter(event.target.value as Invoice["status"] | "All invoices")
            }
          >
          <option value="All invoices">All invoices</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
          <option value="Partially Paid">Partially Paid</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarItem>
          <FilterToolbarSelect
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as "outstandingHigh" | "outstandingLow" | "collectedHigh" | "name",
              )
            }
          >
          <option value="outstandingHigh">Sort: Highest outstanding</option>
          <option value="outstandingLow">Sort: Lowest outstanding</option>
          <option value="collectedHigh">Sort: Highest collected</option>
          <option value="name">Sort: Name</option>
          </FilterToolbarSelect>
        </FilterToolbarItem>
        <FilterToolbarAction href={exportUrl}>Export current view</FilterToolbarAction>
      </FilterToolbar>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <h3 className="font-serif text-2xl text-slate-950">Collections overview</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Money collected</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatInr(collectedRevenue)}</p>
              <p className="mt-2 text-sm text-slate-500">
                {filteredInvoices.filter((invoice) => invoice.status === "Paid").length} paid invoice(s)
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Money outstanding</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatInr(totalOutstanding)}</p>
              <p className="mt-2 text-sm text-slate-500">
                {pendingInvoices.length + overdueInvoices.length} invoice(s) still open
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Total invoiced</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatInr(totalInvoiced)}</p>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-600">Overdue invoices</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{overdueInvoices.length}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {filteredMemberships.map((membership) => {
              const member = profiles.find((profile) => profile.id === membership.memberId);

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
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <h3 className="font-serif text-2xl text-slate-950">Invoice records</h3>
          <div className="mt-4 space-y-4">
            {filteredInvoices.map((invoice) => {
              const member = profiles.find((profile) => profile.id === invoice.memberId);

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
                    <p>Issued {invoice.issuedOn} · Due {invoice.dueOn}</p>
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
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <h3 className="font-serif text-2xl text-slate-950">User-wise accounting report</h3>
        <div className="mt-4 space-y-4">
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
          {memberAccounting.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              No billing records match the current filters.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
