import { buildFormsWorkbook, workbookToBuffer } from "@/lib/excel";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const audience = searchParams.get("audience")?.trim() ?? "All audiences";
  const sort = searchParams.get("sort")?.trim() ?? "title";

  const [forms, responses] = await Promise.all([getAllForms(), getAllFormResponses()]);

  const rows = forms
    .map((form) => ({
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      audience: form.audience,
      status: form.status,
      fieldCount: form.fields.length,
      responseCount: responses.filter((response) => response.formId === form.id).length,
    }))
    .filter((form) => {
      const matchesSearch =
        !search ||
        [form.title, form.description, form.audience].join(" ").toLowerCase().includes(search);
      const matchesAudience = audience === "All audiences" || form.audience === audience;
      return matchesSearch && matchesAudience;
    })
    .sort((a, b) => {
      switch (sort) {
        case "responsesHigh":
          return b.responseCount - a.responseCount || a.title.localeCompare(b.title);
        case "audience":
          return a.audience.localeCompare(b.audience) || a.title.localeCompare(b.title);
        case "title":
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const workbook = buildFormsWorkbook(rows);

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-forms.xlsx"',
    },
  });
}
