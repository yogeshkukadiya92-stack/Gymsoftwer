import { IntakeFormField } from "@/lib/forms";
import { createIntakeForm, deleteIntakeForm, updateIntakeForm } from "@/lib/forms-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    audience?: string;
    fields?: IntakeFormField[];
  };

  if (!body.title?.trim()) {
    return Response.json({ error: "Form title is required." }, { status: 400 });
  }

  const form = await createIntakeForm({
    title: body.title,
    description: body.description ?? "",
    audience: body.audience ?? "",
    fields: body.fields ?? [],
  });

  return Response.json({
    message: "Form created successfully.",
    form,
    sharePath: `/forms/${form.slug}`,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    title?: string;
    description?: string;
    audience?: string;
    fields?: IntakeFormField[];
  };

  if (!body.id?.trim()) {
    return Response.json({ error: "Form id is required." }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return Response.json({ error: "Form title is required." }, { status: 400 });
  }

  try {
    const form = await updateIntakeForm(body.id, {
      title: body.title,
      description: body.description ?? "",
      audience: body.audience ?? "",
      fields: body.fields ?? [],
    });

    return Response.json({
      message: "Form updated successfully.",
      form,
      sharePath: `/forms/${form.slug}`,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Form update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };

  if (!body.id?.trim()) {
    return Response.json({ error: "Form id is required." }, { status: 400 });
  }

  try {
    await deleteIntakeForm(body.id);

    return Response.json({
      message: "Form deleted successfully.",
      id: body.id,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Form delete failed." },
      { status: 400 },
    );
  }
}
