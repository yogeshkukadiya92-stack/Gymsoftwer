import { createFormResponse, getFormBySlug } from "@/lib/forms-store";
import { IntakeFormField } from "@/lib/forms";

function isFieldVisible(field: IntakeFormField, answers: Record<string, string>) {
  if (!field.condition) {
    return true;
  }

  const parentAnswer = answers[field.condition.fieldId] ?? "";
  const selectedValues = parentAnswer
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return selectedValues.includes(field.condition.equals) || parentAnswer === field.condition.equals;
}

function isValidAnswer(field: IntakeFormField, value: string) {
  if (!value.trim()) {
    return true;
  }

  switch (field.type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    case "phone":
      return /^[+()\d\s-]{7,}$/.test(value.trim());
    case "number":
      return !Number.isNaN(Number(value));
    case "link":
      return /^https?:\/\/.+/i.test(value.trim());
    case "linear_scale": {
      const numericValue = Number(value);
      const min = field.scaleMin ?? 1;
      const max = field.scaleMax ?? 5;
      return !Number.isNaN(numericValue) && numericValue >= min && numericValue <= max;
    }
    case "file_upload":
      return value.startsWith("/") || /^https?:\/\/.+/i.test(value.trim());
    default:
      return true;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);

  if (!form) {
    return Response.json({ error: "Form not found." }, { status: 404 });
  }

  const body = (await request.json()) as {
    answers?: Record<string, string>;
  };

  const answers = body.answers ?? {};
  const missingRequired = form.fields.filter(
    (field) => isFieldVisible(field, answers) && field.required && !answers[field.id]?.trim(),
  );

  if (missingRequired.length > 0) {
    return Response.json(
      {
        error: `Missing required fields: ${missingRequired.map((field) => field.label).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const invalidFields = form.fields.filter((field) => {
    if (!isFieldVisible(field, answers)) {
      return false;
    }

    return !isValidAnswer(field, answers[field.id] ?? "");
  });

  if (invalidFields.length > 0) {
    return Response.json(
      {
        error: `Please correct these fields: ${invalidFields.map((field) => field.label).join(", ")}`,
      },
      { status: 400 },
    );
  }

  await createFormResponse(form.id, answers);

  return Response.json({
    message: "Form submitted successfully.",
    redirectUrl: form.redirectUrl ?? "",
  });
}
