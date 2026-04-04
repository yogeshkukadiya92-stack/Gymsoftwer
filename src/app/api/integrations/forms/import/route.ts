import { IntakeFormField } from "@/lib/forms";
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
    const record = value as Record<string, unknown>;

    if (record.text || record.label || record.value || record.title || record.name) {
      return String(
        record.text ?? record.label ?? record.value ?? record.title ?? record.name ?? "",
      ).trim();
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function sanitizeExternalFieldId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function inferFieldType(record: Record<string, unknown>, normalizedValue: string): IntakeFormField["type"] {
  const typeHint = String(record.type ?? record.questionType ?? record.fieldType ?? "")
    .trim()
    .toLowerCase();

  if (
    typeHint.includes("multiple_choice") ||
    typeHint.includes("radio") ||
    typeHint.includes("single_select")
  ) {
    return "multiple_choice";
  }

  if (typeHint.includes("checkbox")) {
    return "checkbox";
  }

  if (typeHint.includes("dropdown") || typeHint.includes("select")) {
    return "dropdown";
  }

  if (typeHint.includes("email")) {
    return "email";
  }

  if (typeHint.includes("phone")) {
    return "phone";
  }

  if (typeHint.includes("number")) {
    return "number";
  }

  if (typeHint.includes("url") || typeHint.includes("link")) {
    return "link";
  }

  if (typeHint.includes("date")) {
    return "date";
  }

  if (typeHint.includes("time")) {
    return "time";
  }

  if (typeHint.includes("textarea") || typeHint.includes("long")) {
    return "paragraph";
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    return "email";
  }

  if (/^[+()\d\s-]{7,}$/.test(normalizedValue)) {
    return "phone";
  }

  if (/^https?:\/\/.+/i.test(normalizedValue)) {
    return "link";
  }

  if (!Number.isNaN(Number(normalizedValue)) && normalizedValue.trim()) {
    return "number";
  }

  return normalizedValue.length > 80 ? "paragraph" : "short_text";
}

function buildTallyField(record: Record<string, unknown>, index: number): IntakeFormField | null {
  const label = String(record.label ?? record.title ?? record.key ?? record.id ?? "").trim();

  if (!label) {
    return null;
  }

  const normalizedValue = normalizeTallyFieldValue(record);
  const answerRecord =
    record.answer && typeof record.answer === "object"
      ? (record.answer as Record<string, unknown>)
      : undefined;
  const options = Array.isArray(record.options)
    ? (record.options as Record<string, unknown>[])
    : Array.isArray(answerRecord?.options)
      ? (answerRecord?.options as Record<string, unknown>[])
      : [];

  const optionMap = Object.fromEntries(
    options
      .map((option) => {
        const optionId = String(option.id ?? option.value ?? option.key ?? "").trim();
        const optionLabel = String(
          option.text ?? option.label ?? option.value ?? option.title ?? optionId,
        ).trim();

        if (!optionId || !optionLabel) {
          return null;
        }

        return [optionId, optionLabel];
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  );

  return {
    id: sanitizeExternalFieldId(label) || `field_${index + 1}`,
    label,
    type: inferFieldType(record, normalizedValue),
    required: false,
    options: Object.values(optionMap),
    optionMap: Object.keys(optionMap).length > 0 ? optionMap : undefined,
  };
}

function mapTallyOptionValue(
  rawValue: unknown,
  options: Record<string, unknown>[],
) {
  const optionMap = new Map<string, string>();

  options.forEach((option) => {
    const optionId = String(option.id ?? option.value ?? option.key ?? "").trim();
    const optionLabel = String(
      option.text ?? option.label ?? option.value ?? option.title ?? optionId,
    ).trim();

    if (optionId) {
      optionMap.set(optionId, optionLabel || optionId);
    }
  });

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => {
        const normalized = normalizeAnswerValue(item).trim();
        return optionMap.get(normalized) ?? normalized;
      })
      .filter(Boolean)
      .join(", ");
  }

  const normalized = normalizeAnswerValue(rawValue).trim();
  return optionMap.get(normalized) ?? normalized;
}

function normalizeTallyFieldValue(record: Record<string, unknown>) {
  const answerRecord =
    record.answer && typeof record.answer === "object"
      ? (record.answer as Record<string, unknown>)
      : undefined;
  const rawValue =
    record.value ??
    answerRecord?.value ??
    answerRecord?.raw ??
    answerRecord?.text ??
    answerRecord?.label;

  const options = Array.isArray(record.options)
    ? (record.options as Record<string, unknown>[])
    : Array.isArray(answerRecord?.options)
      ? (answerRecord?.options as Record<string, unknown>[])
      : [];

  if (options.length > 0) {
    return mapTallyOptionValue(rawValue, options);
  }

  return normalizeAnswerValue(rawValue);
}

function normalizeTallyPayload(body: Record<string, unknown>) {
  const data =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : undefined;
  const topLevelFields = Array.isArray(body.fields) ? body.fields : [];
  const nestedFields = Array.isArray(data?.fields) ? data.fields : [];
  const fields = nestedFields.length > 0 ? nestedFields : topLevelFields;

  const answers = Object.fromEntries(
    fields
      .map((field) => {
        if (!field || typeof field !== "object") {
          return null;
        }

        const record = field as Record<string, unknown>;
        const label = String(record.label ?? record.title ?? record.key ?? record.id ?? "").trim();

        if (!label) {
          return null;
        }

        return [label, normalizeTallyFieldValue(record)];
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  );
  const fields = fields
    .map((field, index) => {
      if (!field || typeof field !== "object") {
        return null;
      }

      return buildTallyField(field as Record<string, unknown>, index);
    })
    .filter((field): field is IntakeFormField => Boolean(field));

  return {
    source: "tally",
    form: {
      id: String(data?.formId ?? body.formId ?? "").trim(),
      title: String(data?.formName ?? body.formName ?? body.title ?? "Tally form").trim(),
      description: "Imported from Tally webhook",
      audience: "External leads",
      fields,
    },
    response: {
      answers,
    },
  };
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

  const rawBody = (await request.json()) as Record<string, unknown>;
  const tallyLikePayload =
    (Boolean(rawBody.data && typeof rawBody.data === "object") &&
      Array.isArray((rawBody.data as Record<string, unknown>).fields)) ||
    Array.isArray(rawBody.fields);
  const body = (tallyLikePayload ? normalizeTallyPayload(rawBody) : rawBody) as {
    source?: string;
    form?: {
      id?: string;
      title?: string;
      description?: string;
      audience?: string;
      fields?: IntakeFormField[];
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
    fields: body.form?.fields,
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
