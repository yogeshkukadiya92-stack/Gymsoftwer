import { signOutCurrentSession } from "@/lib/auth";

export async function POST() {
  await signOutCurrentSession();

  return Response.json({
    message: "Logged out successfully.",
  });
}
