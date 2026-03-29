import { requireRole } from "@/lib/auth";
import {
  createIntegrationApiKey,
  getIntegrationApiKeys,
  revokeIntegrationApiKey,
} from "@/lib/integrations-store";

export async function GET() {
  await requireRole("admin");

  return Response.json({
    keys: await getIntegrationApiKeys(),
  });
}

export async function POST(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    name?: string;
    scopes?: string[];
  };

  if (!body.name?.trim()) {
    return Response.json({ error: "Key name is required." }, { status: 400 });
  }

  const created = await createIntegrationApiKey({
    name: body.name,
    scopes: body.scopes,
  });

  return Response.json({
    message: "API key created successfully.",
    key: created.key,
    plainKey: created.plainKey,
  });
}

export async function DELETE(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as { id?: string };

  if (!body.id?.trim()) {
    return Response.json({ error: "Key id is required." }, { status: 400 });
  }

  const key = await revokeIntegrationApiKey(body.id);

  return Response.json({
    message: "API key revoked successfully.",
    key,
  });
}
