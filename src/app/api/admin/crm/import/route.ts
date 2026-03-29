import { requireRole } from "@/lib/auth";
import { importLeadRecords } from "@/lib/business-data-store";
import { parseLeadsWorkbook } from "@/lib/excel";

export async function POST(request: Request) {
  await requireRole("admin");

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Please attach a leads .xlsx file." }, { status: 400 });
  }

  try {
    const parsed = parseLeadsWorkbook(await file.arrayBuffer());
    const saved = await importLeadRecords(parsed.leads);

    return Response.json({
      message: "Leads workbook imported successfully.",
      summary: parsed.summary,
      duplicatePhones: parsed.duplicatePhones,
      saved: {
        imported: saved.imported.length,
        updated: saved.updated.length,
        totalLeads: saved.totalLeads,
      },
      sampleLeads: parsed.leads.slice(0, 5).map((lead) => ({
        fullName: lead.fullName,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
      })),
      leads: saved.leads,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Leads workbook import failed." },
      { status: 400 },
    );
  }
}
