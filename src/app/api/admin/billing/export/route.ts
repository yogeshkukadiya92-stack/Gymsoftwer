import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildBillingWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const data = await getAppData();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const invoiceStatus = searchParams.get("invoiceStatus")?.trim() ?? "All invoices";
  const membershipStatus = searchParams.get("membershipStatus")?.trim() ?? "All memberships";
  const branch = searchParams.get("branch")?.trim() ?? "All branches";
  const sort = searchParams.get("sort")?.trim() ?? "outstandingHigh";

  const filteredProfiles = data.profiles
    .filter((profile) => profile.role === "member")
    .filter((profile) => {
      const matchesSearch =
        !search ||
        [profile.fullName, profile.email, profile.phone, profile.branch]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesBranch = branch === "All branches" || profile.branch === branch;

      return matchesSearch && matchesBranch;
    });

  const filteredMemberIds = new Set(filteredProfiles.map((profile) => profile.id));
  const filteredMemberships = data.memberships.filter(
    (membership) =>
      filteredMemberIds.has(membership.memberId) &&
      (membershipStatus === "All memberships" || membership.status === membershipStatus),
  );
  const filteredMembershipIds = new Set(filteredMemberships.map((membership) => membership.id));
  const filteredInvoices = data.invoices.filter(
    (invoice) =>
      filteredMemberIds.has(invoice.memberId) &&
      filteredMembershipIds.has(invoice.membershipId) &&
      (invoiceStatus === "All invoices" || invoice.status === invoiceStatus),
  );

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    const outstandingA = filteredMemberships
      .filter((membership) => membership.memberId === a.id)
      .reduce((sum, membership) => sum + membership.outstandingAmountInr, 0);
    const outstandingB = filteredMemberships
      .filter((membership) => membership.memberId === b.id)
      .reduce((sum, membership) => sum + membership.outstandingAmountInr, 0);
    const collectedA = filteredInvoices
      .filter((invoice) => invoice.memberId === a.id && invoice.status === "Paid")
      .reduce((sum, invoice) => sum + invoice.amountInr, 0);
    const collectedB = filteredInvoices
      .filter((invoice) => invoice.memberId === b.id && invoice.status === "Paid")
      .reduce((sum, invoice) => sum + invoice.amountInr, 0);

    switch (sort) {
      case "name":
        return a.fullName.localeCompare(b.fullName);
      case "collectedHigh":
        return collectedB - collectedA || a.fullName.localeCompare(b.fullName);
      case "outstandingLow":
        return outstandingA - outstandingB || a.fullName.localeCompare(b.fullName);
      case "outstandingHigh":
      default:
        return outstandingB - outstandingA || a.fullName.localeCompare(b.fullName);
    }
  });

  const workbook = buildBillingWorkbook({
    ...data,
    profiles: sortedProfiles,
    memberships: filteredMemberships,
    invoices: filteredInvoices,
  });

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-billing-report.xlsx"',
    },
  });
}
