import { buildFormResponsesWorkbook, workbookToBuffer } from "@/lib/excel";
import { getAllForms, getAllFormResponses } from "@/lib/forms-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("formId")?.trim() ?? "";
  const date = searchParams.get("date")?.trim() ?? "";
  const fromTime = searchParams.get("fromTime")?.trim() ?? "";
  const toTime = searchParams.get("toTime")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const device = searchParams.get("device")?.trim() ?? "";
  const browser = searchParams.get("browser")?.trim() ?? "";
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

  const [forms, responses] = await Promise.all([getAllForms(), getAllFormResponses()]);
  const selectedForm = forms.find((form) => form.id === formId) ?? forms[0];

  const rows = responses
    .filter((response) => response.formId === selectedForm?.id)
    .filter((response) => {
      const [datePart = "", timePart = ""] = response.submittedAt.split(" ");
      const matchesDate = !date || datePart === date;
      const matchesFromTime = !fromTime || timePart >= fromTime;
      const matchesToTime = !toTime || timePart <= toTime;
      const matchesCountry = !country || (response.metadata?.country ?? "") === country;
      const matchesCity = !city || (response.metadata?.city ?? "") === city;
      const matchesDevice = !device || (response.metadata?.deviceType ?? "") === device;
      const matchesBrowser = !browser || (response.metadata?.browser ?? "") === browser;
      const matchesSearch =
        !search ||
        Object.values(response.answers).join(" ").toLowerCase().includes(search) ||
        response.submittedAt.toLowerCase().includes(search) ||
        (response.metadata?.submittedFrom ?? "").toLowerCase().includes(search) ||
        (response.metadata?.browser ?? "").toLowerCase().includes(search) ||
        (response.metadata?.deviceType ?? "").toLowerCase().includes(search);

      return (
        matchesDate &&
        matchesFromTime &&
        matchesToTime &&
        matchesCountry &&
        matchesCity &&
        matchesDevice &&
        matchesBrowser &&
        matchesSearch
      );
    })
    .map((response) => {
      const base: Record<string, string> = {
        submitted_at: response.submittedAt,
        device: response.metadata?.deviceType || "-",
        browser: response.metadata?.browser || "-",
        operating_system: response.metadata?.operatingSystem || "-",
        country: response.metadata?.country || "-",
        city: response.metadata?.city || "-",
        location: response.metadata?.submittedFrom || "-",
        ip_address: response.metadata?.ipAddress || "-",
      };

      (selectedForm?.fields ?? []).forEach((field) => {
        base[field.label] = response.answers[field.id] || "-";
      });

      return base;
    });

  const workbook = buildFormResponsesWorkbook(rows, selectedForm?.slug || "responses");

  return new Response(workbookToBuffer(workbook), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gymflow-form-responses.xlsx"',
    },
  });
}
