import { requireRole } from "@/lib/auth";
import { assignFormResponseToMember } from "@/lib/forms-store";

export async function POST(request: Request) {
  await requireRole("admin");

  const body = (await request.json()) as {
    responseId?: string;
    memberId?: string;
    respondentPhone?: string;
  };

  if (!body.responseId?.trim() || !body.memberId?.trim()) {
    return Response.json(
      { error: "Response id and member id are required." },
      { status: 400 },
    );
  }

  try {
    const result = await assignFormResponseToMember({
      responseId: body.responseId,
      memberId: body.memberId,
      respondentPhone: body.respondentPhone?.trim(),
    });

    return Response.json({
      message: "Response matched to user successfully.",
      result,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Response match failed." },
      { status: 400 },
    );
  }
}
