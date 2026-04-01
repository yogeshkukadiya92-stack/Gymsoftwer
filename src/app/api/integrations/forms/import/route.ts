import { createFormResponse, createOrUpdateExternalIntakeForm } from "@/lib/forms-store";
import { validateIntegrationApiKey } from "@/lib/integrations-store";

function extractApiKey(request: Request) {
  const headerKey = request.headers.get("x-api-key");

  if (headerKey?.trim()) {
    return headerKey.trim();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function normalizeAnswerValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeAnswerValue(item)).filter(Boolean).join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function normalizeAnswers(rawAnswers: Record<string, unknown> | undefined) {
  return Object.fromEntries(
    Object.entries(rawAnswers ?? {}).map(([key, value]) => [key, normalizeAnswerValue(value)]),
  );
}

export async function POST(request: Request) {
  const rawKey = extractApiKey(request);

  if (!rawKey) {
    return Response.json({ error: "Missing API key." }, { status: 401 });
  }

  const apiKey = await validateIntegrationApiKey(rawKey);

  if (!apiKey) {
    return Response.json({ error: "Invalid API key." }, { status: 401 });
  }

  const hasFormScope =
    apiKey.scopes.includes("forms") || apiKey.scopes.includes("formResponses");

  if (!hasFormScope) {
    return Response.json(
      { error: "This API key does not allow form imports." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    source?: string;
    form?: {
      id?: string;
      title?: string;
      description?: string;
      audience?: string;
    };
    response?: {
      answers?: Record<string, unknown>;
    };
    answers?: Record<string, unknown>;
  };

  const source = body.source?.trim() || "external";
  const title = body.form?.title?.trim();
  const normalizedAnswers = normalizeAnswers(body.response?.answers ?? body.answers);

  if (!title) {
    return Response.json({ error: "Form title is required." }, { status: 400 });
  }

  if (Object.keys(normalizedAnswers).length === 0) {
    return Response.json({ error: "At least one answer is required." }, { status: 400 });
  }

  const form = await createOrUpdateExternalIntakeForm({
    source,
    externalFormId: body.form?.id,
    title,
    description: body.form?.description,
    audience: body.form?.audience,
    seedAnswers: normalizedAnswers,
  });

  const response = await createFormResponse(
    form.id,
    Object.fromEntries(
      Object.entries(normalizedAnswers).map(([key, value]) => {
        const matchingField = form.fields.find(
          (field) => field.label.trim().toLowerCase() === key.trim().toLowerCase(),
        );

        return [matchingField?.id ?? key, value];
      }),
    ),
  );

  return Response.json({
    message: "External form response imported successfully.",
    form: {
      id: form.id,
      title: form.title,
      slug: form.slug,
      sharePath: `/forms/${form.slug}`,
      adminResponsesPath: "/admin/form-responses",
    },
    response: {
      id: response.id,
      submittedAt: response.submittedAt,
    },
  });
}
