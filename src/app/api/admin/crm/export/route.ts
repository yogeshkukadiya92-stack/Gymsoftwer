import { requireRole } from "@/lib/auth";
import { getLeadRecords } from "@/lib/business-data-store";
import { buildLeadsWorkbook, workbookToBuffer } from "@/lib/excel";

export async function GET(request: Request) {
  await requireRole("admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "All statuses";
  const source = searchParams.get("source")?.trim() ?? "All sources";
  const sort = searchParams.get("sort")?.trim() ?? "nextFollowUp";

  const leads = await getLeadRecords();
  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        !search ||
        [
          lead.fullName,
          lead.phone,
          lead.goal,
          lead.source,
          lead.status,
          lead.assignedTo,
          lead.note,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesStatus = status === "All statuses" || lead.status === status;
      const matchesSource = source === "All sources" || lead.source === source;

      return matchesSearch && matchesStatus && matchesSource;
    })
    .sort((a, b) => {
      switch (sort) {
        case "name":
          return a.fullName.localeCompare(b.fullName);
        case "source":
          return a.source.localeCompare(b.source) || a.fullName.localeCompare(b.fullName);
        case "status":
          return a.status.localeCompare(b.status) || a.fullName.localeCompare(b.fullName);
        case "recent":
          return b.nextFollowUp.localeCompare(a.nextFollowUp);
        case "nextFollowUp":
        default:
          return a.nextFollowUp.localeCompare(b.nextFollowUp);
      }
    });

  const workbook = buildLeadsWorkbook(filteredLeads);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-leads.xlsx"',
    },
  });
}
