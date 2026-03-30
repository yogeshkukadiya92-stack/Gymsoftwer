import { requireRole } from "@/lib/auth";
import { saveUserPermissionSettings } from "@/lib/app-data-store";

export async function PUT(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    userId?: string;
    allowedRoutes?: string[];
  };

  if (!body.userId?.trim() || !Array.isArray(body.allowedRoutes)) {
    return Response.json(
      { error: "User id and allowed routes are required." },
      { status: 400 },
    );
  }

  try {
    const permission = await saveUserPermissionSettings({
      userId: body.userId.trim(),
      allowedRoutes: body.allowedRoutes.filter((route) => typeof route === "string"),
    });

    return Response.json({
      message: "User permissions updated successfully.",
      permission,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "User permissions update failed." },
      { status: 400 },
    );
  }
}
