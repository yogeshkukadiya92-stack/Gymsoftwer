import { requireRole } from "@/lib/auth";
import { getBranchCatalog } from "@/lib/branch-utils";
import { createGymBranch, editGymBranch } from "@/lib/app-data-store";
import { getAppData } from "@/lib/data";

function normalizeKind(value: string) {
  return value === "Online" ? "Online" : "Physical";
}

export async function GET() {
  await requireRole("admin");
  const data = await getAppData();

  return Response.json({
    branches: getBranchCatalog(data),
  });
}

export async function POST(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    name?: string;
    city?: string;
    address?: string;
    managerName?: string;
    phone?: string;
    kind?: string;
  };

  if (!body.name?.trim()) {
    return Response.json({ error: "Branch name is required." }, { status: 400 });
  }

  const branch = await createGymBranch({
    name: body.name.trim(),
    city: body.city?.trim() ?? "",
    address: body.address?.trim() ?? "",
    managerName: body.managerName?.trim() ?? "",
    phone: body.phone?.trim() ?? "",
    kind: normalizeKind(body.kind ?? "Physical"),
  });

  return Response.json({ message: "Branch created successfully.", branch });
}

export async function PUT(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    city?: string;
    address?: string;
    managerName?: string;
    phone?: string;
    kind?: string;
  };

  if (!body.id?.trim() || !body.name?.trim()) {
    return Response.json({ error: "Branch id and name are required." }, { status: 400 });
  }

  try {
    const branch = await editGymBranch(body.id, {
      name: body.name.trim(),
      city: body.city?.trim() ?? "",
      address: body.address?.trim() ?? "",
      managerName: body.managerName?.trim() ?? "",
      phone: body.phone?.trim() ?? "",
      kind: normalizeKind(body.kind ?? "Physical"),
    });

    return Response.json({ message: "Branch updated successfully.", branch });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Branch update failed." },
      { status: 400 },
    );
  }
}
