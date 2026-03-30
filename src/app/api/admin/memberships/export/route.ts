import { requireRole } from "@/lib/auth";
import { getAppData } from "@/lib/data";
import { buildMembershipsWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "All statuses";
  const paymentStatus = searchParams.get("paymentStatus")?.trim() ?? "All payment statuses";
  const branch = searchParams.get("branch")?.trim() ?? "All branches";
  const sort = searchParams.get("sort")?.trim() ?? "renewalSoon";

  const data = await getAppData();
  const rows = data.memberships
    .map((membership) => {
      const member = data.profiles.find((entry) => entry.id === membership.memberId);

      return {
        memberName: member?.fullName ?? "",
        email: member?.email ?? "",
        branch: member?.branch ?? "",
        planName: membership.planName,
        status: membership.status,
        billingCycle: membership.billingCycle,
        paymentStatus: membership.paymentStatus,
        amountInr: membership.amountInr,
        outstandingAmountInr: membership.outstandingAmountInr,
        renewalDate: membership.renewalDate,
        nextInvoiceDate: membership.nextInvoiceDate,
        paymentMethod: membership.paymentMethod,
      };
    })
    .filter((row) => {
      const matchesSearch =
        !search ||
        [row.memberName, row.email, row.branch, row.planName, row.paymentMethod]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesStatus = status === "All statuses" || row.status === status;
      const matchesPayment =
        paymentStatus === "All payment statuses" || row.paymentStatus === paymentStatus;
      const matchesBranch = branch === "All branches" || row.branch === branch;

      return matchesSearch && matchesStatus && matchesPayment && matchesBranch;
    })
    .sort((a, b) => {
      switch (sort) {
        case "name":
          return a.memberName.localeCompare(b.memberName);
        case "outstandingHigh":
          return b.outstandingAmountInr - a.outstandingAmountInr || a.memberName.localeCompare(b.memberName);
        case "branch":
          return a.branch.localeCompare(b.branch) || a.memberName.localeCompare(b.memberName);
        case "renewalSoon":
        default:
          return a.renewalDate.localeCompare(b.renewalDate);
      }
    });

  const workbook = buildMembershipsWorkbook(rows);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-memberships.xlsx"',
    },
  });
}
