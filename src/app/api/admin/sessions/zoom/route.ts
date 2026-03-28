import { requireRole } from "@/lib/auth";
import { updateSessionZoomLink } from "@/lib/app-data-store";

export async function POST(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    sessionId?: string;
    zoomLink?: string;
    room?: string;
  };

  if (!body.sessionId?.trim() || !body.zoomLink?.trim()) {
    return Response.json(
      { error: "Session and Zoom link are required." },
      { status: 400 },
    );
  }

  try {
    const session = await updateSessionZoomLink(body.sessionId, {
      zoomLink: body.zoomLink.trim(),
      room: body.room?.trim(),
    });

    return Response.json({
      message: "Zoom link saved successfully.",
      session,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Zoom link save failed." },
      { status: 400 },
    );
  }
}
