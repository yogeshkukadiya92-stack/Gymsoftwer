import { cookies } from "next/headers";

import { adminSessionCookie, isValidAdminLogin } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return Response.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (!isValidAdminLogin(body.email, body.password)) {
    return Response.json(
      { error: "Invalid login credentials." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookie, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({
    message: "Login successful.",
  });
}
