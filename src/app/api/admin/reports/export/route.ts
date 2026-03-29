import { requireRole } from "@/lib/auth";
import { buildReportsWorkbook, workbookToBuffer } from "@/lib/excel";
import { getReportsSnapshot } from "@/lib/reporting";

export async function GET() {
  await requireRole("admin");

  const snapshot = await getReportsSnapshot();
  const workbook = buildReportsWorkbook({
    members: snapshot.members.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      branch: member.branch,
      joinedOn: member.joinedOn,
    })),
    memberGrowth: snapshot.memberGrowth,
    presentCount: snapshot.presentCount,
    absentCount: snapshot.absentCount,
    bookedCount: snapshot.bookedCount,
    collectedRevenue: snapshot.collectedRevenue,
    outstandingRevenue: snapshot.outstandingRevenue,
    overdueInvoices: snapshot.overdueInvoices,
    estimatedInventoryMargin: snapshot.estimatedInventoryMargin,
    topFormResponses: snapshot.topFormResponses,
    trainerRows: snapshot.trainerRows,
    leads: snapshot.leads.map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      source: lead.source,
      status: lead.status,
      assignedTo: lead.assignedTo,
    })),
    leadStats: snapshot.leadStats,
    avgDietAdherence: snapshot.avgDietAdherence,
  });

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-reports.xlsx"',
    },
  });
}
