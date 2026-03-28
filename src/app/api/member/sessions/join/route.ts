import { getAuthenticatedProfile } from "@/lib/auth";
import { markAttendanceCheckedIn } from "@/lib/app-data-store";
import { getAppData } from "@/lib/data";

export async function POST(request: Request) {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }

  const body = (await request.json()) as { sessionId?: string };

  if (!body.sessionId?.trim()) {
    return Response.json({ error: "Session is required." }, { status: 400 });
  }

  const data = await getAppData();
  const session = data.sessions.find((item) => item.id === body.sessionId);

  if (!session) {
    return Response.json({ error: "Session not found." }, { status: 404 });
  }

  if (!session.zoomLink?.trim()) {
    return Response.json({ error: "Zoom link is not available for this class yet." }, { status: 400 });
  }

  await markAttendanceCheckedIn({
    sessionId: session.id,
    memberId: profile.id,
  });

  return Response.json({
    message: "Attendance marked and Zoom link ready.",
    joinUrl: session.zoomLink,
  });
}
